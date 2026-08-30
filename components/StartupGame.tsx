"use client";
import {useEffect,useRef} from "react";
import Phaser from "phaser";
import styles from "./StartupGame.module.css";

export default function StartupGame(){
 const mount=useRef<HTMLDivElement>(null);
 useEffect(()=>{
  if(!mount.current)return;
  class CityScene extends Phaser.Scene{
   player!:Phaser.GameObjects.Rectangle; customers:Phaser.GameObjects.Container[]=[]; money=10000; day=1; stock=0; selected=false; info!:Phaser.GameObjects.Text; cashText!:Phaser.GameObjects.Text; tutorial!:Phaser.GameObjects.Text;
   constructor(){super("city")}
   create(){
    this.cameras.main.setBackgroundColor("#8fc9df");
    this.add.rectangle(640,120,1280,240,0x9fd5e5); this.add.circle(1080,90,48,0xffdf83);
    for(let i=0;i<12;i++){const h=90+Math.random()*150;this.add.rectangle(55+i*105,290-h/2,75,h,0x61777b).setOrigin(.5);for(let y=0;y<3;y++)this.add.rectangle(30+i*105,y*25+210-h/2,8,10,0xf0d879)}
    this.add.rectangle(640,510,1280,250,0x46504e);for(let x=0;x<1280;x+=90)this.add.rectangle(x,510,48,5,0xe4d07b);
    this.add.text(40,30,"STARTUP TYCOON",{fontFamily:"Arial",fontSize:"22px",fontStyle:"bold",color:"#ffffff"});
    this.cashText=this.add.text(40,62,"₱10,000",{fontFamily:"Arial",fontSize:"20px",fontStyle:"bold",color:"#d9f56a"});
    this.add.text(1090,35,`DAY ${this.day}`,{fontFamily:"Arial",fontSize:"16px",fontStyle:"bold",color:"#ffffff"});
    this.add.text(500,245,"YOUR TOWN",{fontFamily:"Arial",fontSize:"14px",color:"#ffffff"});
    const shop=this.add.container(640,430);shop.add(this.add.rectangle(0,0,250,170,0xb87950));shop.add(this.add.rectangle(0,-52,210,42,0x26352e));shop.add(this.add.text(0,-52,"CORNER CAFÉ",{fontFamily:"Arial",fontSize:"16px",fontStyle:"bold",color:"#f3e7bd"}).setOrigin(.5));shop.add(this.add.rectangle(-65,10,70,60,0x7faeb8));shop.add(this.add.rectangle(65,10,70,60,0x7faeb8));shop.add(this.add.rectangle(0,40,46,70,0x563e34));shop.setSize(250,170);shop.setInteractive();shop.on("pointerdown",()=>this.enterShop());
    this.player=this.add.rectangle(640,600,22,34,0x385f78);this.player.setDepth(3);
    this.info=this.add.text(40,700,"WASD / ARROWS to walk  •  Click your shop to enter",{fontFamily:"Arial",fontSize:"15px",color:"#ffffff"});
    this.tutorial=this.add.text(640,650,"TUTORIAL 01  •  Walk to your shop and click it",{fontFamily:"Arial",fontSize:"16px",fontStyle:"bold",color:"#18231c",backgroundColor:"#d9f56a",padding:{left:14,right:14,top:10,bottom:10}}).setOrigin(.5);
    this.input.keyboard?.on("keydown",()=>this.move());
   }
   move(){const k=this.input.keyboard;if(!k)return;const speed=8;if(k.addKey("LEFT").isDown||k.addKey("A").isDown)this.player.x-=speed;if(k.addKey("RIGHT").isDown||k.addKey("D").isDown)this.player.x+=speed;if(k.addKey("UP").isDown||k.addKey("W").isDown)this.player.y-=speed;if(k.addKey("DOWN").isDown||k.addKey("S").isDown)this.player.y+=speed;this.player.x=Phaser.Math.Clamp(this.player.x,20,1260);this.player.y=Phaser.Math.Clamp(this.player.y,330,690)}
   enterShop(){this.scene.pause();this.scene.launch("shop",{parent:this});}
   spend(n:number){this.money-=n;this.cashText.setText(`₱${this.money.toLocaleString()}`)}
   addCustomer(){const c=this.add.container(Phaser.Math.Between(80,1200),400);c.add(this.add.circle(0,-15,9,0xc98e68));c.add(this.add.rectangle(0,8,20,30,Phaser.Math.Between(0x476d83,0x8c5361)));this.customers.push(c);this.tweens.add({targets:c,x:640,y:430,duration:Phaser.Math.Between(2500,4500),onComplete:()=>{if(this.stock>0){this.stock--;this.money+=35;this.cashText.setText(`₱${this.money.toLocaleString()}`)}this.tweens.add({targets:c,x:c.x+Phaser.Math.Between(-300,300),duration:1800,onComplete:()=>c.destroy()})}})}
  }
  class ShopScene extends Phaser.Scene{parent!:CityScene;status!:Phaser.GameObjects.Text;create(data:any){this.parent=data.parent;this.cameras.main.setBackgroundColor("#1b261f");this.add.text(50,35,"CORNER CAFÉ",{fontFamily:"Arial",fontSize:"28px",fontStyle:"bold",color:"#fff"});this.add.text(50,75,"STORE INTERIOR  •  BUILD MODE",{fontFamily:"Arial",fontSize:"12px",color:"#a8b4a9"});this.add.rectangle(640,400,900,500,0xb47a55);this.add.rectangle(640,650,900,18,0x704b39);this.add.rectangle(500,390,130,60,0x604333);this.add.rectangle(500,350,100,20,0xd8a56e);this.add.text(450,300,"SHELF",{fontFamily:"Arial",fontSize:"12px",color:"#fff"});const counter=this.add.rectangle(800,500,180,70,0x593f34).setInteractive({draggable:true});this.input.setDraggable(counter);this.add.text(735,545,"DRAG ME",{fontFamily:"Arial",fontSize:"11px",color:"#d9f56a"});this.status=this.add.text(50,690,"Inventory: 0  •  Click STOCK to buy supplies",{fontFamily:"Arial",fontSize:"14px",color:"#fff"});const stock=this.add.text(900,690,"STOCK 10  •  ₱180",{fontFamily:"Arial",fontSize:"15px",fontStyle:"bold",color:"#17200f",backgroundColor:"#d9f56a",padding:{left:12,right:12,top:10,bottom:10}}).setInteractive();stock.on("pointerdown",()=>{if(this.parent.money>=180){this.parent.spend(180);this.parent.stock+=10;this.status.setText(`Inventory: ${this.parent.stock}  •  Ready for customers`)}else this.status.setText("Not enough cash")});const open=this.add.text(1040,50,"OPEN STORE",{fontFamily:"Arial",fontSize:"13px",fontStyle:"bold",color:"#17200f",backgroundColor:"#d9f56a",padding:{left:12,right:12,top:9,bottom:9}}).setInteractive();open.on("pointerdown",()=>{this.scene.stop();this.parent.scene.resume();this.parent.tutorial.setText("CUSTOMER FLOW  •  Customers now walk to your store");for(let i=0;i<4;i++)this.time.delayedCall(i*900,()=>this.parent.addCustomer())});const back=this.add.text(50,735,"← Back to town",{fontFamily:"Arial",fontSize:"13px",color:"#a8b4a9"}).setInteractive();back.on("pointerdown",()=>{this.scene.stop();this.parent.scene.resume()});this.input.on("drag",(_:any,g:Phaser.GameObjects.GameObject,x:number,y:number)=>{(g as any).x=x;(g as any).y=y})}}
  const config:Phaser.Types.Core.GameConfig={type:Phaser.AUTO,width:1280,height:760,parent:mount.current,backgroundColor:"#142019",scale:{mode:Phaser.Scale.FIT,autoCenter:Phaser.Scale.CENTER_BOTH},scene:[CityScene,ShopScene],render:{antialias:true}};
  const game=new Phaser.Game(config);return()=>game.destroy(true);
 },[]);
 return <div className={styles.wrap}><div ref={mount} className={styles.canvas}/><div className={styles.mobileHint}>Use the on-screen game controls on desktop/mobile. Tap the shop to enter.</div></div>
}
