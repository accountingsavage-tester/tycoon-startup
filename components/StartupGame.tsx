"use client";
import {useEffect,useRef} from "react";
import Phaser from "phaser";
import styles from "./StartupGame.module.css";

type GameData={cash:number;stock:number;day:number;sales:number;reputation:number};
const SAVE="startup-tycoon-save";
const fresh=():GameData=>({cash:10000,stock:0,day:1,sales:0,reputation:10});

export default function StartupGame(){
 const mount=useRef<HTMLDivElement>(null);
 useEffect(()=>{
  if(!mount.current)return;
  const state:GameData=(()=>{try{return {...fresh(),...JSON.parse(localStorage.getItem(SAVE)||"{}")}}catch{return fresh()}})();
  const save=()=>localStorage.setItem(SAVE,JSON.stringify(state));
  const makeTexture=(scene:Phaser.Scene,key:string,draw:(g:Phaser.GameObjects.Graphics)=>void,w=48,h=64)=>{const g=scene.make.graphics({x:0,y:0,add:false});draw(g);g.generateTexture(key,w,h);g.destroy()};
  class Town extends Phaser.Scene{
   player!:Phaser.Physics.Arcade.Sprite; keys!:Phaser.Types.Input.Keyboard.CursorKeys; wasd!:Record<string,Phaser.Input.Keyboard.Key>; shop!:Phaser.GameObjects.Rectangle; objective!:Phaser.GameObjects.Text; target?:Phaser.Math.Vector2;
   constructor(){super("Town")}
   create(){const w=1280,h=760;this.physics.world.setBounds(0,0,w,h);
    makeTexture(this,"player",g=>{g.fillStyle(0x385f78).fillRoundedRect(9,22,30,38,8);g.fillStyle(0xc98e68).fillCircle(24,13,12);g.fillStyle(0x202a2d).fillRect(13,1,22,6)});
    makeTexture(this,"npc",g=>{g.fillStyle(0x52758b).fillRoundedRect(8,22,32,38,8);g.fillStyle(0xc98e68).fillCircle(24,13,12);g.fillStyle(0x303536).fillRect(12,1,24,7)});
    this.add.rectangle(w/2,h*.2,w,h*.4,0xa6d8e8);this.add.circle(1080,90,46,0xffdf86);
    for(let i=0;i<15;i++){const x=35+i*88,bh=80+((i*41)%130);this.add.rectangle(x,390-bh/2,62,bh,0x60767b);for(let j=0;j<3;j++)this.add.rectangle(x-18+j*18,370-bh/2,8,10,0xe9d37d)}
    this.add.rectangle(w/2,605,w,310,0x475250);this.add.rectangle(w/2,605,w,7,0x718079);for(let x=25;x<w;x+=90)this.add.rectangle(x,605,48,5,0xe4d07a);
    for(let i=0;i<12;i++){this.add.circle(45+i*115,480-(i%3)*22,22,0x356342);this.add.rectangle(42+i*115,500-(i%3)*22,7,28,0x6b4d36)}
    this.shop=this.add.rectangle(640,450,290,195,0xb87950).setStrokeStyle(7,0x4e3b32).setInteractive({useHandCursor:true});this.add.rectangle(640,384,235,46,0x28362f);this.add.text(640,384,"CORNER CAFÉ",{fontFamily:"Arial",fontSize:"19px",fontStyle:"bold",color:"#f2e6c2"}).setOrigin(.5);this.add.rectangle(575,455,80,68,0x83b4be).setStrokeStyle(5,0x654637);this.add.rectangle(705,455,80,68,0x83b4be).setStrokeStyle(5,0x654637);this.add.rectangle(640,522,55,86,0x543d34);
    this.shop.on("pointerdown",()=>this.enterShop());
    this.player=this.physics.add.sprite(240,620,"player").setScale(.85).setCollideWorldBounds(true);this.keys=this.input.keyboard!.createCursorKeys();this.wasd={W:this.input.keyboard!.addKey("W"),A:this.input.keyboard!.addKey("A"),S:this.input.keyboard!.addKey("S"),D:this.input.keyboard!.addKey("D")};
    this.add.text(24,22,`STARTUP TYCOON   •   ₱${state.cash.toLocaleString()}   •   DAY ${state.day}   •   STOCK ${state.stock}`,{fontFamily:"Arial",fontSize:"16px",fontStyle:"bold",color:"#fff",backgroundColor:"#17221cdd",padding:{x:13,y:10}}).setDepth(10);
    this.objective=this.add.text(640,710,state.stock?"TUTORIAL 02  •  Open your business and serve customers":"TUTORIAL 01  •  Walk to the café and enter it",{fontFamily:"Arial",fontSize:"15px",fontStyle:"bold",color:"#18221b",backgroundColor:"#d9f56a",padding:{x:14,y:9}}).setOrigin(.5).setDepth(10);
    this.input.on("pointerdown",(p:Phaser.Input.Pointer)=>{if(p.y>535)this.moveTo(p.x,p.y)});
   }
   moveTo(x:number,y:number){this.target=new Phaser.Math.Vector2(x,y);this.physics.moveTo(this.player,x,y,210)}
   enterShop(){this.scene.pause();this.scene.launch("Shop")}
   update(){let x=0,y=0;if(this.keys.left.isDown||this.wasd.A.isDown)x--;if(this.keys.right.isDown||this.wasd.D.isDown)x++;if(this.keys.up.isDown||this.wasd.W.isDown)y--;if(this.keys.down.isDown||this.wasd.S.isDown)y++;if(x||y){this.target=undefined;this.player.setVelocity(x*190,y*190)}else if(this.target&&Phaser.Math.Distance.Between(this.player.x,this.player.y,this.target.x,this.target.y)<8){this.player.setVelocity(0);this.target=undefined}}
  }
  class Shop extends Phaser.Scene{
   status!:Phaser.GameObjects.Text;opened=false;customers:Phaser.GameObjects.Container[]=[];customerTimer?:Phaser.Time.TimerEvent;
   constructor(){super("Shop")}
   create(){const w=1280,h=760;this.add.rectangle(w/2,h/2,w,h,0x18221d);this.add.rectangle(w/2,h/2,1000,580,0xc9a477).setStrokeStyle(12,0x5b4032);this.add.rectangle(w/2,145,1000,80,0x694839);this.add.text(140,118,"CORNER CAFÉ",{fontFamily:"Arial",fontSize:"27px",fontStyle:"bold",color:"#f6ead0"});this.add.text(140,156,`DAY ${state.day}  •  CASH ₱${state.cash.toLocaleString()}`,{fontFamily:"Arial",fontSize:"12px",color:"#cdbfa3"});
    for(let i=0;i<4;i++){this.add.rectangle(220+i*105,270,85,48,0x765746);this.add.text(220+i*105,270,"SHELF",{fontSize:"9px",color:"#e8d5b3"}).setOrigin(.5)}
    const counter=this.add.rectangle(820,460,210,75,0x5a4034).setInteractive({draggable:true});this.input.setDraggable(counter);this.add.text(820,460,"DRAG COUNTER",{fontFamily:"Arial",fontSize:"12px",fontStyle:"bold",color:"#d9f56a"}).setOrigin(.5);
    this.status=this.add.text(140,650,`STOCK ${state.stock}  •  BUY 10 = ₱180`,{fontFamily:"Arial",fontSize:"15px",fontStyle:"bold",color:"#fff"});
    const stock=this.add.text(720,640,"BUY 10 COFFEES  •  ₱180",{fontFamily:"Arial",fontSize:"13px",fontStyle:"bold",color:"#17200f",backgroundColor:"#d9f56a",padding:{x:14,y:11}}).setInteractive({useHandCursor:true});stock.on("pointerdown",()=>this.buy());
    const open=this.add.text(1010,75,state.stock?"OPEN BUSINESS":"BUY STOCK FIRST",{fontFamily:"Arial",fontSize:"13px",fontStyle:"bold",color:"#17200f",backgroundColor:"#d9f56a",padding:{x:12,y:9}}).setInteractive({useHandCursor:true});open.on("pointerdown",()=>this.openBusiness(open));
    this.add.text(140,710,"ESC  •  RETURN TO TOWN",{fontFamily:"Arial",fontSize:"11px",color:"#c8bda7"}).setInteractive().on("pointerdown",()=>this.leave());this.input.keyboard!.on("keydown-ESC",()=>this.leave());
    this.input.on("drag",(_:any,obj:Phaser.GameObjects.GameObject,x:number,y:number)=>{(obj as Phaser.GameObjects.Rectangle).x=x;(obj as Phaser.GameObjects.Rectangle).y=y});
   }
   buy(){if(state.cash<180){this.status.setText("Not enough cash.");return}state.cash-=180;state.stock+=10;this.status.setText(`STOCK ${state.stock}  •  Inventory delivered`);save()}
   openBusiness(btn:Phaser.GameObjects.Text){if(!state.stock){this.status.setText("Buy inventory before opening.");return}if(this.opened)return;this.opened=true;btn.setText("BUSINESS OPEN");this.status.setText("Customers are entering. Click one when they reach the counter.");for(let i=0;i<5;i++)this.time.delayedCall(i*900,()=>this.spawnCustomer());this.customerTimer=this.time.addEvent({delay:4500,callback:()=>this.spawnCustomer(),loop:true})}
   spawnCustomer(){if(!this.scene.isActive())return;const c=this.add.container(270,550).setSize(48,70).setInteractive({useHandCursor:true});c.add(this.add.circle(0,-25,13,0xc98e68));c.add(this.add.rectangle(0,10,28,45,[0x557b96,0xb66b59,0x6c8a63,0x78639c][Phaser.Math.Between(0,3)]));this.customers.push(c);this.tweens.add({targets:c,x:820,y:500,duration:1800,ease:"Sine.easeInOut",onComplete:()=>this.status.setText("CUSTOMER READY  •  click to serve")});c.on("pointerdown",()=>this.serve(c))}
   serve(c:Phaser.GameObjects.Container){if(!state.stock){this.status.setText("SOLD OUT  •  buy more stock");return}state.stock--;state.cash+=35;state.sales+=35;state.reputation=Math.min(100,state.reputation+1);this.status.setText(`SALE +₱35  •  Cash ₱${state.cash.toLocaleString()}  •  Stock ${state.stock}`);this.tweens.add({targets:c,x:1120,y:550,duration:900,onComplete:()=>c.destroy()});save()}
   leave(){this.customerTimer?.remove(false);this.scene.stop();this.scene.resume("Town")}
  }
  game=new Phaser.Game({type:Phaser.AUTO,width:1280,height:760,parent:mount.current,backgroundColor:"#142019",scale:{mode:Phaser.Scale.FIT,autoCenter:Phaser.Scale.CENTER_BOTH},physics:{default:"arcade",arcade:{debug:false}},scene:[Town,Shop],render:{antialias:true}});
  return()=>game.destroy(true);
 },[]);
 return <div className={styles.wrap}><div ref={mount} className={styles.canvas}/><div className={styles.mobileHint}>Tap the ground to move. Tap the café to enter. Use WASD or arrow keys on desktop.</div></div>;
}
