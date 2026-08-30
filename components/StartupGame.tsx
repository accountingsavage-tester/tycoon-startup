"use client";
import {useEffect,useRef} from "react";
import Phaser from "phaser";
import styles from "./StartupGame.module.css";

type GameData={cash:number;stock:number;day:number;sales:number;reputation:number};
const SAVE="startup-tycoon-save";

export default function StartupGame(){
 const mount=useRef<HTMLDivElement>(null);
 useEffect(()=>{
  if(!mount.current)return;
  const saved:GameData=(()=>{try{return JSON.parse(localStorage.getItem(SAVE)||"")}catch{return {cash:10000,stock:0,day:1,sales:0,reputation:10}}})();
  const state:GameData={cash:saved.cash??10000,stock:saved.stock??0,day:saved.day??1,sales:saved.sales??0,reputation:saved.reputation??10};
  let game:Phaser.Game;
  class Town extends Phaser.Scene{
   player!:Phaser.Physics.Arcade.Sprite; keys!:Phaser.Types.Input.Keyboard.CursorKeys; wasd!:Record<string,Phaser.Input.Keyboard.Key>; hud!:Phaser.GameObjects.Text; objective!:Phaser.GameObjects.Text; shop!:Phaser.GameObjects.Rectangle; open=false; customers:Phaser.GameObjects.Container[]=[];
   constructor(){super("Town")}
   create(){const w=1280,h=760;this.physics.world.setBounds(0,0,w,h);
    this.add.rectangle(w/2,h*.22,w,h*.44,0x9fd4e5);this.add.circle(1080,90,46,0xffdf86);
    for(let i=0;i<16;i++){const x=30+i*82, bh=70+((i*37)%130);this.add.rectangle(x,370-bh/2,58,bh,0x61757a);for(let j=0;j<3;j++)this.add.rectangle(x-18+j*18,350-bh/2,7,9,0xe9d37d)}
    this.add.rectangle(w/2,600,w,320,0x46514f);this.add.rectangle(w/2,600,w,7,0x71807a);for(let x=20;x<w;x+=90)this.add.rectangle(x,600,48,5,0xe5d17b);
    for(let i=0;i<11;i++){const t=this.add.circle(40+i*120,470-(i%2)*25,22,0x356342);this.add.rectangle(t.x,495-(i%2)*25,7,25,0x6b4d36)}
    this.shop=this.add.rectangle(640,445,280,190,0xb97850).setStrokeStyle(6,0x4e3b32).setInteractive({useHandCursor:true});
    this.add.rectangle(640,382,230,45,0x28362f);this.add.text(640,382,"CORNER CAFÉ",{fontFamily:"Arial",fontSize:"18px",fontStyle:"bold",color:"#f2e6c2"}).setOrigin(.5);
    this.add.rectangle(580,455,80,68,0x83b4be).setStrokeStyle(5,0x654637);this.add.rectangle(700,455,80,68,0x83b4be).setStrokeStyle(5,0x654637);this.add.rectangle(640,520,55,85,0x543d34);
    this.shop.on("pointerdown",()=>this.enterShop());
    this.player=this.physics.add.sprite(250,620,"player").setScale(.8);this.player.setCollideWorldBounds(true);
    this.keys=this.input.keyboard!.createCursorKeys();this.wasd={W:this.input.keyboard!.addKey("W"),A:this.input.keyboard!.addKey("A"),S:this.input.keyboard!.addKey("S"),D:this.input.keyboard!.addKey("D")};
    this.hud=this.add.text(24,22,`₱${state.cash.toLocaleString()}   •   DAY ${state.day}   •   STOCK ${state.stock}`, {fontFamily:"Arial",fontSize:"17px",fontStyle:"bold",color:"#fff",backgroundColor:"#17221ccc",padding:{x:13,y:10}}).setDepth(10);
    this.objective=this.add.text(640,710,"TUTORIAL 01  •  Walk to the café and enter it",{fontFamily:"Arial",fontSize:"15px",fontStyle:"bold",color:"#18221b",backgroundColor:"#d9f56a",padding:{x:14,y:9}}).setOrigin(.5).setDepth(10);
    this.input.on("pointerdown",(p:Phaser.Input.Pointer)=>{if(p.y>540)this.movePlayer(p.x,p.y)});
   }
   movePlayer(x:number,y:number){this.physics.moveTo(this.player,x,y,210);this.time.delayedCall(Phaser.Math.Clamp(this.physics.moveToDistance(this.player,x,y)/210*1000,250,3500),()=>this.player.setVelocity(0))}
   enterShop(){this.scene.pause();this.scene.launch("Shop");}
   update(){let x=0,y=0;if(this.keys.left.isDown||this.wasd.A.isDown)x--;if(this.keys.right.isDown||this.wasd.D.isDown)x++;if(this.keys.up.isDown||this.wasd.W.isDown)y--;if(this.keys.down.isDown||this.wasd.S.isDown)y++;this.player.setVelocity(x*190,y*190);}
  }
  class Shop extends Phaser.Scene{
   status!:Phaser.GameObjects.Text;customer?:Phaser.GameObjects.Container;served=false;counter!:Phaser.GameObjects.Rectangle;
   constructor(){super("Shop")}
   create(){const w=1280,h=760;this.add.rectangle(w/2,h/2,w,h,0x1a241e);this.add.rectangle(w/2,h/2,1000,580,0xc9a477).setStrokeStyle(12,0x5b4032);this.add.rectangle(w/2,145,1000,80,0x6a4938);
    this.add.text(140,118,"CORNER CAFÉ",{fontFamily:"Arial",fontSize:"27px",fontStyle:"bold",color:"#f6ead0"});this.add.text(140,156,"DAY "+state.day+"  •  STORE INTERIOR",{fontFamily:"Arial",fontSize:"12px",color:"#cdbfa3"});
    this.add.text(170,205,"STORAGE",{fontFamily:"Arial",fontSize:"12px",fontStyle:"bold",color:"#513b30});for(let i=0;i<4;i++){this.add.rectangle(220+i*105,270,85,48,0x765746);this.add.text(220+i*105,270,"SHELF",{fontSize:"9px",color:"#e8d5b3"}).setOrigin(.5)}
    this.counter=this.add.rectangle(820,460,210,75,0x5a4034).setInteractive({draggable:true});this.input.setDraggable(this.counter);this.add.text(820,460,"DRAG COUNTER",{fontFamily:"Arial",fontSize:"12px",fontStyle:"bold",color:"#d9f56a"}).setOrigin(.5);
    this.status=this.add.text(140,665,`Cash ₱${state.cash.toLocaleString()}   •   Stock ${state.stock}`,{fontFamily:"Arial",fontSize:"15px",fontStyle:"bold",color:"#fff"});
    const stock=this.add.text(720,650,"BUY 10 COFFEES  •  ₱180",{fontFamily:"Arial",fontSize:"13px",fontStyle:"bold",color:"#17200f",backgroundColor:"#d9f56a",padding:{x:14,y:11}}).setInteractive({useHandCursor:true});stock.on("pointerdown",()=>this.buy());
    const open=this.add.text(1010,75,"OPEN BUSINESS",{fontFamily:"Arial",fontSize:"13px",fontStyle:"bold",color:"#17200f",backgroundColor:"#d9f56a",padding:{x:12,y:9}}).setInteractive({useHandCursor:true});open.on("pointerdown",()=>this.openBusiness(open));
    const back=this.add.text(140,720,"ESC  •  RETURN TO TOWN",{fontFamily:"Arial",fontSize:"11px",color:"#c8bda7"}).setInteractive();back.on("pointerdown",()=>this.leave());this.input.keyboard!.on("keydown-ESC",()=>this.leave());
    this.input.on("drag",(_:any,obj:Phaser.GameObjects.GameObject,x:number,y:number)=>{(obj as Phaser.GameObjects.Rectangle).x=x;(obj as Phaser.GameObjects.Rectangle).y=y});
   }
   buy(){if(state.cash<180){this.status.setText("Not enough cash.");return}state.cash-=180;state.stock+=10;this.status.setText(`Cash ₱${state.cash.toLocaleString()}   •   Stock ${state.stock}   •   Inventory delivered`);save()}
   openBusiness(btn:Phaser.GameObjects.Text){if(state.stock<=0){this.status.setText("Buy inventory before opening the business.");return}if(this.served)return;btn.setText("BUSINESS OPEN");this.served=true;this.status.setText("Customers are entering. Click a customer to serve them.");for(let i=0;i<4;i++)this.time.delayedCall(i*1000,()=>this.spawnCustomer())}
   spawnCustomer(){const c=this.add.container(270,550).setSize(40,70).setInteractive({useHandCursor:true});c.add(this.add.circle(0,-25,13,0xc98e68));c.add(this.add.rectangle(0,10,28,45,[0x557b96,0xb66b59,0x6c8a63,0x78639c][this.customersIndex()]));this.tweens.add({targets:c,x:820,y:500,duration:1800,ease:"Sine.easeInOut",onComplete:()=>{this.status.setText("Customer waiting • click them to serve");}});c.on("pointerdown",()=>this.serve(c))}
   customersIndex(){return Math.floor(Math.random()*4)}
   serve(c:Phaser.GameObjects.Container){if(!state.stock)return this.status.setText("Sold out. Buy more stock.");state.stock--;state.cash+=35;state.sales+=35;state.reputation=Math.min(100,state.reputation+1);this.status.setText(`SALE +₱35   •   Cash ₱${state.cash.toLocaleString()}   •   Stock ${state.stock}`);this.tweens.add({targets:c,x:1100,y:550,duration:1000,onComplete:()=>c.destroy()});save()}
   leave(){this.scene.stop();this.scene.resume("Town")}
  }
  function save(){localStorage.setItem(SAVE,JSON.stringify(state));}
  const g=this.make.graphics({x:0,y:0,add:false});g.fillStyle(0x4d7188).fillRoundedRect(0,0,32,48,8);g.fillStyle(0xc98e68).fillCircle(16,10,10);g.generateTexture("player",32,48);g.destroy();
  game=new Phaser.Game({type:Phaser.AUTO,width:1280,height:760,parent:mount.current,backgroundColor:"#142019",scale:{mode:Phaser.Scale.FIT,autoCenter:Phaser.Scale.CENTER_BOTH},physics:{default:"arcade",arcade:{debug:false}},scene:[Town,Shop],render:{antialias:true}});
  return()=>game.destroy(true);
 },[]);
 return <div className={styles.wrap}><div ref={mount} className={styles.canvas}/><div className={styles.mobileHint}>Tap the ground to move. Tap the café to enter. Use the in-game controls to run your business.</div></div>;
}
