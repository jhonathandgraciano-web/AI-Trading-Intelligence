const SYMBOLS=["BTCUSDT","ETHUSDT","SOLUSDT","BNBUSDT","XRPUSDT","ADAUSDT","DOGEUSDT","AVAXUSDT","LINKUSDT","LTCUSDT"];
const json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{"content-type":"application/json; charset=utf-8","cache-control":"no-store","access-control-allow-origin":"*"}});
async function binance(path){let err;for(const base of ["https://api.binance.com","https://data-api.binance.vision"]){try{const r=await fetch(base+path,{headers:{accept:"application/json"}});if(!r.ok)throw Error("Binance HTTP "+r.status);return await r.json()}catch(e){err=e}}throw err||Error("Binance indisponível")}
function ema(a,n){if(a.length<n)return NaN;const k=2/(n+1);let v=a.slice(0,n).reduce((x,y)=>x+y,0)/n;for(let i=n;i<a.length;i++)v=a[i]*k+v*(1-k);return v}
function rsi(a){const w=a.slice(-15);if(w.length<15)return 50;let g=0,l=0;for(let i=1;i<w.length;i++){const d=w[i]-w[i-1];if(d>0)g+=d;else l-=d}return l===0?100:100-100/(1+g/l)}
export class TradingState{
 constructor(ctx,env){this.ctx=ctx;this.env=env}
 async fetch(req){const u=new URL(req.url);if(u.pathname==="/state")return json((await this.ctx.storage.get("state"))||{positions:{},history:[],signals:{},events:[],lastRun:null,status:"A aguardar primeiro ciclo",outcomes:[]});if(u.pathname==="/run"&&req.method==="POST"){try{return json(await this.cycle())}catch(e){const st=(await this.ctx.storage.get("state"))||{positions:{},history:[],signals:{},events:[]};st.lastError=String(e.message||e);st.status="ERRO NO CICLO: "+st.lastError;st.failedAt=Date.now();await this.ctx.storage.put("state",st);return json({ok:false,error:st.lastError,status:st.status},502)}}return json({error:"not found"},404)}
 async cycle(){
  const old=(await this.ctx.storage.get("state"))||{positions:{},history:[],signals:{},events:[]};
  const state={...old,positions:{...(old.positions||{})},history:[...(old.history||[])],signals:{...(old.signals||{})},events:[...(old.events||[])]};
  let tickers={};
  try{const rows=await binance("/api/v3/ticker/price");tickers=Object.fromEntries(rows.filter(x=>SYMBOLS.includes(x.symbol)).map(x=>[x.symbol,Number(x.price)]))}catch(e){state.lastPriceFeedError=String(e.message||e)}
  const outcomes=[];
  let cursor=0;
  const workers=Array.from({length:3},async()=>{while(true){const i=cursor++;if(i>=SYMBOLS.length)return;const s=SYMBOLS[i];try{
   const candles=await binance("/api/v3/klines?symbol="+s+"&interval=5m&limit=80");
   if(!Array.isArray(candles)||candles.length<30)throw Error("Candles insuficientes");
   const closed=candles.slice(0,-1),cl=closed.map(x=>Number(x[4])),vol=closed.map(x=>Number(x[5]));
   const price=tickers[s]||cl[cl.length-1],e9=ema(cl.slice(-60),9),e21=ema(cl.slice(-60),21),strength=rsi(cl);
   const v=vol.slice(-21,-1),avg=v.reduce((a,b)=>a+b,0)/Math.max(1,v.length),volOk=vol[vol.length-1]>avg*1.05;
   let label="SEM ENTRADA";const p=state.positions[s];
   if(p){
    if(price<=p.stop||price>=p.target||(e9<e21&&strength<40)||strength<35){
     const reason=price<=p.stop?"STOP LOSS":price>=p.target?"TAKE PROFIT":"SAÍDA TÉCNICA",pnl=(price/p.entry-1)*100;
     state.history.unshift({symbol:s,entry:p.entry,exit:price,reason,pnl,time:Date.now(),openedAt:p.openedAt});delete state.positions[s];label="SAÍDA";
     this.event(state,"SAÍDA",s,reason+" @ "+price.toFixed(4)+" ("+pnl.toFixed(2)+"%)");
    }else if(e9<e21||strength<44){label="POSSÍVEL SAÍDA";if(state.signals[s]?.label!=="POSSÍVEL SAÍDA")this.event(state,label,s,"Indicadores enfraquecendo; posição simulada continua aberta")}
    else label="EM OPERAÇÃO";
   }else if(e9>e21&&strength>=52&&strength<=69&&volOk){
    const recent=closed.slice(-14),atr=recent.reduce((sum,k)=>sum+Number(k[2])-Number(k[3]),0)/recent.length;
    const stop=price-Math.max(atr*1.5,price*.008),target=price+Math.max(atr*2.2,price*.012);
    state.positions[s]={entry:price,stop,target,openedAt:Date.now(),strategy:"EMA9/21 + RSI14 + volume",mode:"PAPER"};
    label="ENTRADA";this.event(state,label,s,"COMPRA SIMULADA @ "+price.toFixed(4)+" · SL "+stop.toFixed(4)+" · TP "+target.toFixed(4));
   }else if(e9>e21&&strength>=48&&strength<=72)label="PRÉ-ALERTA";
   state.signals[s]={label,price,rsi:Number(strength.toFixed(2)),ema9:e9,ema21:e21,updatedAt:Date.now()};
   outcomes[i]={symbol:s,ok:true,label,price};
  }catch(e){state.signals[s]={label:"SEM DADOS",error:String(e.message||e),updatedAt:Date.now()};outcomes[i]={symbol:s,ok:false,error:String(e.message||e)}}}});
  await Promise.all(workers);
  const ok=outcomes.filter(x=>x?.ok).length,entries=outcomes.filter(x=>x?.label==="ENTRADA").length,open=Object.keys(state.positions).length;
  state.lastRun=Date.now();state.lastError=null;state.outcomes=outcomes;state.status="ROBÔ ATIVO · "+ok+"/10 ativos analisados · "+entries+" novas entradas simuladas · "+open+" posições abertas";
  state.events=state.events.slice(0,100);state.history=state.history.slice(0,100);
  await this.ctx.storage.put("state",state);
  return {ok:true,lastRun:state.lastRun,status:state.status,outcomes,openPositions:open,entries};
 }
 event(st,type,symbol,message){st.events.unshift({type,symbol,message,time:Date.now()})}
}
export default{
 async fetch(request,env){const u=new URL(request.url);if(u.pathname==="/api/health")return json({ok:true,service:"ai-trading-intelligence",mode:"paper-trading",schedule:"hourly",time:Date.now()});if(u.pathname.startsWith("/api/")){const id=env.TRADING_STATE.idFromName("global"),stub=env.TRADING_STATE.get(id);if(u.pathname==="/api/state")return stub.fetch("https://state/state");if(u.pathname==="/api/run"&&request.method==="POST")return stub.fetch("https://state/run",{method:"POST"});return json({error:"not found"},404)}return env.ASSETS.fetch(request)},
 async scheduled(event,env,ctx){const id=env.TRADING_STATE.idFromName("global"),stub=env.TRADING_STATE.get(id);ctx.waitUntil(stub.fetch("https://state/run",{method:"POST"}))}
};