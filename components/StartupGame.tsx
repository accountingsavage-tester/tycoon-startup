"use client";
import {useEffect,useRef} from "react";
import styles from "./StartupGame.module.css";

type GameData={cash:number;stock:number;day:number;sales:number;reputation:number};
const SAVE="startup-tycoon-save";
const fresh=():GameData=>({cash:10000,stock:0,day:1,sales:0,reputation:10});
const URBAN="https://raw.githubusercontent.com/Two-Weeks-Team/openClawWorld/main/packages/client/public/assets/kenney/urban/urban_tilemap.png";
const CHARS="https://raw.githubusercontent.com/Two-Weeks-Team/openClawWorld/main/packages/client/public/assets/kenney/characters/characters_spritesheet.png";

export default function StartupGame(){
 const mount=useRef<HTMLDivElement>(null);
 useEffect(()=>{
  if(!mount.current)return;
  let game:any;let cancelled=false;
  const start=async()=>{
   const Phaser=await import("phaser");
   if(cancelled||!mount.current)return;
   const state:GameData=(()=>{try{return {...fresh(),...JSON.parse(localStorage.getItem(SAVE)||"{}")}}catch{return fresh()}})();
   const save=()=>localStorage.setItem(SAVE,JSON.stringify(state));
   class Town extends Phaser.Scene{
    player!:any;keys!:any;wasd!:Record<string,any>;target?:any;shop!:any;hud!:any;objective!:any;
    constructor(){super("Town")}
    preload(){this.load.spritesheet("urban",URBAN,{frameWidth:16,frameHeight:16});this.load.spritesheet("chars",CHARS,{frameWidth:16,frameHeight:16})}
    create(){const W=1280,H=760,T=48;
     this.cameras.main.setBackgroundColor("#202735");
     // Pixel-art city ground: deliberately rendered at 3x native 16px tiles.
     const groundIds=[0,1,2,3,4,5,6,7,8,9,10,11];
     for(let y=0;y<15;y++)for(let x=0;x<27;x++){const id=groundIds[(x+y)%groundIds.length];this.add.image(x*T+T/2,y*T+T/2,"urban",id).setScale(3).setOrigin(.5)}
     // Main street and sidewalks.
     for(let x=0;x<27;x++){this.add.rectangle(x*T+T/2,525,T,120,0x343a43);this.add.rectangle(x*T+T/2,468,T,4,0xe8d779);this.add.rectangle(x*T+T/2,582,T,4,0xe8d779)}
     for(let x=0;x<27;x+=2)this.add.rectangle(x*T+T/2,525,24,4,0xf0e5ae);
     // Pixel buildings assembled from real urban tiles.
     this.building(110,120,[120,121,122,147,148,149],"MARKET");
     this.building(420,115,[153,154,155,180,181,182],"OFFICE");
     this.building(965,110,[185,186,187,212,213,214],"ARCADE");
     this.building(110,360,[239,240,241,266,267,268],"BAKERY");
     this.building(965,365,[293,294,295,320,321,322],"STORE");
     // Player: real pixel character sheet frame from the CC0 pack.
     this.player=this.physics.add.sprite(300,610,"chars",21).setScale(3).setCollideWorldBounds(true);
     this.player.setDepth(20);
     this.keys=this.input.keyboard!.createCursorKeys();this.wasd={W:this.input.keyboard!.addKey("W"),A:this.input.keyboard!.addKey("A"),S:this.input.keyboard!.addKey("S"),D:this.input.keyboard!.addKey("D")};
     // Your business marker.
     this.shop=this.add.rectangle(640,355,180,105,0x000000,0).setStrokeStyle(4,0xd9f56a).setInteractive({useHandCursor:true}).setDepth(15);
     this.add.image(640,345,"urban",340).setScale(4).setDepth(14);
     this.add.text(640,405,"YOUR CAFÉ",{fontFamily:"monospace",fontSize:"18px",fontStyle:"bold",color:"#d9f56a",stroke:"#17221c",strokeThickness:5}).setOrigin(.5).setDepth(20);
     this.shop.on("pointerdown",()=>this.enterShop());
     this.hud=this.add.text(20,18,`₱${state.cash.toLocaleString()}   DAY ${state.day}   STOCK ${state.stock}   REP ★${state.reputation}`,{fontFamily:"monospace",fontSize:"17px",fontStyle:"bold",color:"#fff",backgroundColor:"#111827e8",padding:{x:14,y:10}}).setDepth(50);
     this.objective=this.add.text(W/2,H-28,state.stock?"TUTORIAL 02  •  Open the café and serve customers":"TUTORIAL 01  •  Walk to the glowing café",{fontFamily:"monospace",fontSize:"14px",fontStyle:"bold",color:"#17221c",backgroundColor:"#d9f56a",padding:{x:14,y:8}}).setOrigin(.5).setDepth(50);
     this.input.on("pointerdown",(p:any)=>{if(p.y>80)this.moveTo(p.x,p.y)});
    }
    building(x:number,y:number,ids:number[],label:string){for(let r=0;r<2;r++)for(let c=0;c<3;c++)this.add.image(x+c*48,y+r*48,"urban",ids[r*3+c]).setScale(3).setDepth(8);this.add.text(x+72,y-20,label,{fontFamily:"monospace",fontSize:"12px",fontStyle:"bold",color:"#fff",backgroundColor:"#18212bdd",padding:{x:7,y:5}}).setOrigin(.5).setDepth(10)}
    moveTo(x:number,y:number){this.target=new Phaser.Math.Vector2(x,y);this.physics.moveTo(this.player,x,y,210)}
    enterShop(){this.scene.pause();this.scene.launch("Shop")}
    update(){let x=0,y=0;if(this.keys.left.isDown||this.wasd.A.isDown)x--;if(this.keys.right.isDown||this.wasd.D.isDown)x++;if(this.keys.up.isDown||this.wasd.W.isDown)y--;if(this.keys.down.isDown||this.wasd.S.isDown)y++;if(x||y){this.target=undefined;this.player.setVelocity(x*190,y*190)}else if(this.target&&Phaser.Math.Distance.Between(this.player.x,this.player.y,this.target.x,this.target.y)<8){this.player.setVelocity(0);this.target=undefined}}
   }
   class Shop extends Phaser.Scene{
    status!:any;opened=false;timer?:any;customers:any[]=[];back!:any;
    constructor(){super("Shop")}
    create(){const W=1280,H=760;this.add.rectangle(W/2,H/2,W,H,0x151b24);this.add.rectangle(W/2,H/2,1040,600,0x9b6b4d).setStrokeStyle(8,0x30261f);
     for(let y=190;y<600;y+=48)for(let x=160;x<1120;x+=48)this.add.image(x,y,"urban",(x/48+y/48)%486).setScale(3).setAlpha(.45);
     this.add.text(120,105,"CORNER CAFÉ",{fontFamily:"monospace",fontSize:"32px",fontStyle:"bold",color:"#d9f56a",stroke:"#17221c",strokeThickness:6});
     this.add.text(120,150,`DAY ${state.day}   CASH ₱${state.cash.toLocaleString()}   REP ★${state.reputation}`,{fontFamily:"monospace",fontSize:"14px",color:"#fff"});
     this.add.image(640,315,"urban",340).setScale(6);this.add.text(640,410,"COUNTER",{fontFamily:"monospace",fontSize:"15px",fontStyle:"bold",color:"#fff",backgroundColor:"#26352b",padding:{x:10,y:7}}).setOrigin(.5);
     const buy=this.add.text(180,650,"BUY 10 STOCK  •  ₱180",{fontFamily:"monospace",fontSize:"15px",fontStyle:"bold",color:"#17221c",backgroundColor:"#d9f56a",padding:{x:14,y:11}}).setInteractive({useHandCursor:true});buy.on("pointerdown",()=>this.buy());
     const open=this.add.text(610,650,state.stock?"OPEN BUSINESS":"BUY STOCK FIRST",{fontFamily:"monospace",fontSize:"15px",fontStyle:"bold",color:"#17221c",backgroundColor:"#d9f56a",padding:{x:14,y:11}}).setInteractive({useHandCursor:true});open.on("pointerdown",()=>this.openBusiness(open));
     this.status=this.add.text(180,585,`INVENTORY ${state.stock}   •   Customers will physically walk to the counter`,{fontFamily:"monospace",fontSize:"13px",color:"#fff"});
     this.back=this.add.text(1120,105,"ESC  •  TOWN",{fontFamily:"monospace",fontSize:"12px",color:"#d9f56a"}).setOrigin(1,0).setInteractive();this.back.on("pointerdown",()=>this.leave());this.input.keyboard!.on("keydown-ESC",()=>this.leave());
    }
    buy(){if(state.cash<180)return this.status.setText("NOT ENOUGH CASH");state.cash-=180;state.stock+=10;this.status.setText(`STOCK ${state.stock}   •   DELIVERY COMPLETE`);save()}
    openBusiness(btn:any){if(!state.stock)return this.status.setText("BUY STOCK FIRST");if(this.opened)return;this.opened=true;btn.setText("BUSINESS OPEN  •  CUSTOMERS ARRIVING");this.status.setText("Customers are moving through the shop. Click one at the counter to serve.");for(let i=0;i<4;i++)this.time.delayedCall(i*850,()=>this.spawnCustomer());this.timer=this.time.addEvent({delay:4200,callback:()=>this.spawnCustomer(),loop:true})}
    spawnCustomer(){if(!this.scene.isActive())return;const c=this.add.sprite(250,520,"chars",48+Phaser.Math.Between(0,4)*27).setScale(3).setInteractive({useHandCursor:true}).setDepth(30);this.customers.push(c);this.tweens.add({targets:c,x:640,y:440,duration:1900,ease:"Sine.easeInOut",onComplete:()=>{c.setTint(0xd9f56a);this.status.setText("CUSTOMER READY  •  TAP THEM TO SERVE")}});c.on("pointerdown",()=>this.serve(c))}
    serve(c:any){if(!state.stock)return this.status.setText("SOLD OUT");state.stock--;state.cash+=35;state.sales+=35;state.reputation=Math.min(100,state.reputation+1);this.status.setText(`SALE +₱35   •   CASH ₱${state.cash.toLocaleString()}   •   STOCK ${state.stock}`);this.tweens.add({targets:c,x:1030,y:520,duration:800,onComplete:()=>c.destroy()});save()}
    leave(){this.timer?.remove(false);this.scene.stop();this.scene.resume("Town")}
   }
   game=new Phaser.Game({type:Phaser.AUTO,width:1280,height:760,parent:mount.current,backgroundColor:"#202735",pixelArt:true,antialias:false,roundPixels:true,scale:{mode:Phaser.Scale.FIT,autoCenter:Phaser.Scale.CENTER_BOTH},physics:{default:"arcade",arcade:{debug:false}},scene:[Town,Shop],render:{pixelArt:true,antialias:false,roundPixels:true}});
  };
  start();return()=>{cancelled=true;game?.destroy(true)};
 },[]);
 return <div className={styles.wrap}><div ref={mount} className={styles.canvas}/><div className={styles.mobileHint}>PIXEL MODE • Tap to move • Tap the glowing café • WASD / arrows on desktop</div></div>;
}
