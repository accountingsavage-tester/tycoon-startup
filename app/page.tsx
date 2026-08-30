"use client";
import {useEffect,useState} from "react";
import {ArrowRight,Coins,Factory,ShoppingBag,Sparkles,Users,X,Zap} from "lucide-react";
import styles from "./page.module.css";

type Product={id:string;name:string;emoji:string;cost:number;price:number;demand:number};
type Game={cash:number;day:number;inventory:number;reputation:number;customers:number;sales:number;profit:number;staff:number;product:Product|null;tutorial:number};
const start:Game={cash:10000,day:1,inventory:0,reputation:10,customers:0,sales:0,profit:0,staff:0,product:null,tutorial:0};
const products:Product[]=[{id:"coffee",name:"Iced Coffee",emoji:"☕",cost:18,price:35,demand:8},{id:"sandwich",name:"Club Sandwich",emoji:"🥪",cost:32,price:65,demand:5},{id:"cake",name:"Cake Slice",emoji:"🍰",cost:24,price:50,demand:6}];
export default function Home(){
 const[g,setG]=useState(start),[screen,setScreen]=useState<"town"|"shop"|"end">("town"),[toast,setToast]=useState("");
 useEffect(()=>{const s=localStorage.getItem("startup-tycoon");if(s)try{setG(JSON.parse(s))}catch{}},[]);useEffect(()=>localStorage.setItem("startup-tycoon",JSON.stringify(g)),[g]);
 const note=(s:string)=>{setToast(s);setTimeout(()=>setToast(""),1600)};
 const choose=(p:Product)=>{const cost=p.cost*10;if(g.cash<cost)return note("Not enough cash.");setG(x=>({...x,cash:x.cash-cost,inventory:10,product:p,tutorial:2}));setScreen("town");note(`${p.name} is now in stock!`)};
 const sell=()=>{if(!g.product)return note("Choose a product first.");if(!g.inventory)return note("Sold out. Restock.");const p=g.product;setG(x=>({...x,cash:x.cash+p.price,inventory:x.inventory-1,customers:x.customers+1,sales:x.sales+p.price,profit:x.profit+p.price-p.cost,reputation:Math.min(100,x.reputation+.5),tutorial:4}));note(`Sale +₱${p.price}`)};
 const restock=()=>{if(!g.product)return note("Choose a product first.");const cost=g.product.cost*10;if(g.cash<cost)return note("Not enough cash.");setG(x=>({...x,cash:x.cash-cost,inventory:x.inventory+10}));note("10 units restocked")};
 const hire=()=>{if(g.cash<1000)return note("Hiring costs ₱1,000.");setG(x=>({...x,cash:x.cash-1000,staff:x.staff+1,reputation:Math.min(100,x.reputation+4)}));note("New employee hired")};
 const endDay=()=>{if(!g.product)return note("Buy a product first.");const p=g.product,sales=Math.min(g.inventory,Math.max(3,Math.round(p.demand+g.reputation/20))),earned=sales*p.price,cost=sales*p.cost+120+g.staff*80;setG(x=>({...x,day:x.day+1,cash:x.cash+earned-cost,inventory:x.inventory-sales,customers:x.customers+sales,sales:x.sales+earned,profit:x.profit+earned-cost,tutorial:6}));setScreen("end")};
 const reset=()=>{localStorage.removeItem("startup-tycoon");setG(start);setScreen("town")};
 return <main className={styles.game}>
  <header className={styles.topbar}><div className={styles.logo}><span>ST</span> STARTUP TYCOON</div><div className={styles.day}>DAY {g.day}</div><div className={styles.money}><Coins/>₱{g.cash.toLocaleString()}</div></header>
  <section className={styles.world}><div className={styles.sky}><div className={styles.sun}/><div className={`${styles.cloud} ${styles.cloud1}`}/><div className={`${styles.cloud} ${styles.cloud2}`}/></div><div className={styles.city}><div className={`${styles.building} ${styles.b1}`}/><div className={`${styles.building} ${styles.b2}`}/><div className={`${styles.building} ${styles.b3}`}/><span className={styles.tree}>🌳</span><span className={`${styles.tree} ${styles.tree2}`}>🌳</span></div><div className={styles.road}/>
   <button className={styles.shopBuilding} onClick={()=>setScreen("shop")}><div className={styles.shopSign}>☕ CORNER CAFÉ</div><div className={styles.shopWindow}>{g.product?<>{g.product.emoji}<small>OPEN</small></>:<><b>?</b><small>YOUR EMPTY SHOP</small></>}</div><div className={styles.door}/></button>
   {g.customers>0&&Array.from({length:Math.min(9,g.customers)}).map((_,i)=><div className={styles.person} key={i} style={{left:`${16+i*9}%`,animationDelay:`${i*.2}s`}}>🧑</div>)}
   {g.product&&g.inventory>0&&<button className={styles.customerBubble} onClick={sell}><span>A customer is waiting</span><b>{g.product.emoji} {g.product.name}</b><strong>SELL +₱{g.product.price}</strong></button>}
   <div className={styles.hud}><Stat label="REPUTATION" value={`${Math.round(g.reputation)}/100`} pct={g.reputation}/><Stat label="INVENTORY" value={String(g.inventory)} pct={Math.min(100,g.inventory*10)}/><Stat label="STAFF" value={String(g.staff)} pct={Math.min(100,g.staff*25)}/></div>
  </section>
  <footer className={styles.controls}><div className={styles.goal}><Sparkles/><div><small>NEXT OBJECTIVE</small><b>{g.tutorial<2?"Buy your first product":g.tutorial<4?"Make your first sale":g.tutorial<6?"Finish the day":"Grow the company"}</b></div></div><div className={styles.actions}><button onClick={()=>setScreen("shop")}><ShoppingBag/>Shop</button><button onClick={restock} disabled={!g.product}><Factory/>Restock</button><button onClick={hire}><Users/>Hire</button><button className={styles.primary} onClick={endDay}>End Day <ArrowRight/></button></div></footer>
  {screen==="shop"&&<div className={styles.overlay}><div className={styles.modal}><button className={styles.close} onClick={()=>setScreen("town")}><X/></button><small className={styles.kicker}>DAY 1 · FIRST DECISION</small><h1>Choose your first product</h1><p>You have ₱10,000. Buy your first batch, attract customers, and make your first sale.</p><div className={styles.products}>{products.map(p=><button className={styles.product} key={p.id} onClick={()=>choose(p)}><span>{p.emoji}</span><b>{p.name}</b><small>Cost ₱{p.cost} · Sell ₱{p.price}</small><strong>Buy 10 · ₱{p.cost*10}</strong></button>)}</div></div></div>}
  {screen==="end"&&<div className={styles.overlay}><div className={styles.endcard}><div className={styles.endIcon}><Zap/></div><small className={styles.kicker}>DAY COMPLETE</small><h1>Day {g.day-1} is over.</h1><div className={styles.results}><Result label="Revenue" value={`₱${g.sales.toLocaleString()}`}/><Result label="Customers" value={String(g.customers)}/><Result label="Lifetime profit" value={`₱${g.profit.toLocaleString()}`}/></div><p>{g.profit>=0?"The shop survived its first day. Now scale it into something bigger.":"Your first day was rough. Change your strategy and try again."}</p><button className={styles.primaryBig} onClick={()=>setScreen("town")}>Start Day {g.day}<ArrowRight/></button><button className={styles.reset} onClick={reset}>Reset save</button></div></div>}
  {toast&&<div className={styles.toast}>{toast}</div>}
 </main>;
}
function Stat({label,value,pct}:{label:string;value:string;pct:number}){return <div><small>{label}</small><b>{value}</b><div className={styles.bar}><i style={{width:`${pct}%`}}/></div></div>}
function Result({label,value}:{label:string;value:string}){return <div><small>{label}</small><b>{value}</b></div>}
