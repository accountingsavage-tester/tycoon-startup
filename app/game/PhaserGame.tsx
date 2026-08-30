"use client";
import {useEffect,useRef} from "react";
import Phaser from "phaser";

type Props={onState?:(s:{cash:number;day:number;inventory:number;sales:number})=>void};

class TownScene extends Phaser.Scene{
 player!:Phaser.Physics.Arcade.Sprite; cursors!:Phaser.Types.Input.Keyboard.CursorKeys; wasd!:Record<string,Phaser.Input.Keyboard.Key>; shop!:Phaser.GameObjects.Rectangle; prompt!:Phaser.GameObjects.Text; customers:Phaser.Physics.Arcade.Sprite[]=[]; cash=10000; inventory=0; day=1; sales=0;
 constructor(){super("Town");}
 preload(){
   const g=this.make.graphics({x:0,y:0,add:false});
   g.fillStyle(0x355b46).fillCircle(16,16,16).generateTexture("tree",32,32);g.clear();
   g.fillStyle(0x26333a).fillRoundedRect(0,0,32,44,6).generateTexture("person",32,44);g.clear();
   g.fillStyle(0x9b6747).fillRect(0,0,180,120).generateTexture("shop",180,120);g.clear();
   g.fillStyle(0xe6d39b).fillRect(0,0,110,34).generateTexture("sign",110,34);g.destroy();
 }
 create(){
   this.cameras.main.setBackgroundColor("#9ccfe2");
   const w=this.scale.width,h=this.scale.height;
   this.add.rectangle(w/2,h*.69,w,h*.62,0x6d856f);this.add.rectangle(w/2,h*.84,w,h*.32,0x404b4b);this.add.rectangle(w/2,h*.84,w,4,0xe4cf78);
   for(let x=40;x<w;x+=105){this.add.rectangle(x,h*.83,3,32,0xe7d88d);}
   for(let i=0;i<13;i++){const t=this.add.image(30+i*90,h*.55-(i%3)*25,"tree");t.setScale(.9);}
   this.shop=this.add.rectangle(w/2,h*.58,180,120,0x9b6747).setStrokeStyle(5,0x4c3a31).setInteractive({useHandCursor:true});
   this.add.text(w/2,h*.53,"CORNER CAFÉ",{fontFamily:"Arial",fontSize:"16px",fontStyle:"bold",color:"#1c2b22",backgroundColor:"#ead8a6",padding:{x:12,y:7}}).setOrigin(.5);
   this.add.rectangle(w/2,h*.625,52,55,0x5b4338).setStrokeStyle(3,0x2e2723);
   this.add.text(w/2,h*.72,"CLICK THE CAFÉ TO ENTER",{fontFamily:"Arial",fontSize:"11px",fontStyle:"bold",color:"#ffffff"}).setOrigin(.5);
   this.player=this.physics.add.sprite(w*.18,h*.76,"person").setTint(0xd9f56a).setScale(.75);this.player.setCollideWorldBounds(true);
   this.cursors=this.input.keyboard!.createCursorKeys();this.wasd={W:this.input.keyboard!.addKey("W"),A:this.input.keyboard!.addKey("A"),S:this.input.keyboard!.addKey("S"),D:this.input.keyboard!.addKey("D")};
   this.prompt=this.add.text(24,24,"DAY 1  •  WALK TO YOUR CAFÉ",{fontFamily:"Arial",fontSize:"15px",fontStyle:"bold",color:"#17221a",backgroundColor:"#f4f0df",padding:{x:12,y:9}}).setDepth(10);
   this.shop.on("pointerdown",()=>this.openStore());
   this.input.on("pointerdown",(p:Phaser.Input.Pointer)=>{if(p.y>h*.68){this.moveTo(p.x,p.y)}});
   this.spawnCustomers();
 }
 moveTo(x:number,y:number){this.tweens.add({targets:this.player,x,y,duration:Math.min(900,Math.max(250,Phaser.Math.Distance.Between(this.player.x,this.player.y,x,y)*3)),ease:"Sine.easeOut"});}
 spawnCustomers(){for(let i=0;i<4;i++){const c=this.physics.add.sprite(Phaser.Math.Between(50,this.scale.width-50),this.scale.height*.78,"person").setTint([0x577b9a,0xb66a55,0x775e9a,0x6d8b62][i]);this.customers.push(c);this.tweens.add({targets:c,x:this.scale.width/2+Phaser.Math.Between(-45,45),y:this.scale.height*.68,duration:2500+i*600,yoyo:true,repeat:-1,ease:"Sine.easeInOut"});}}
 openStore(){this.scene.start("Store",{cash:this.cash,inventory:this.inventory,day:this.day,sales:this.sales});}
 update(){const speed=180;let x=0,y=0;if(this.cursors.left.isDown||this.wasd.A.isDown)x--;if(this.cursors.right.isDown||this.wasd.D.isDown)x++;if(this.cursors.up.isDown||this.wasd.W.isDown)y--;if(this.cursors.down.isDown||this.wasd.S.isDown)y++;if(x||y){this.player.setVelocity(x*speed,y*speed);this.player.setRotation(Math.atan2(y,x)+Math.PI/2);}else this.player.setVelocity(0);}
}
class StoreScene extends Phaser.Scene{
 cash=10000;inventory=0;day=1;sales=0; player!:Phaser.Physics.Arcade.Sprite; customer!:Phaser.GameObjects.Container; selected?:Phaser.GameObjects.Rectangle; info!:Phaser.GameObjects.Text;
 constructor(){super("Store");}
 init(data:any){this.cash=data.cash??10000;this.inventory=data.inventory??0;this.day=data.day??1;this.sales=data.sales??0;}
 preload(){const g=this.make.graphics({x:0,y:0,add:false});g.fillStyle(0x355b46).fillCircle(16,16,16).generateTexture("person2",32,32);g.clear();g.fillStyle(0x9b6747).fillRoundedRect(0,0,110,55,5).generateTexture("counter",110,55);g.destroy();}
 create(){const w=this.scale.width,h=this.scale.height;this.add.rectangle(w/2,h/2,w,h,0xcba77e);this.add.rectangle(w/2,18,w,36,0x4d3b31);this.add.text(22,7,"CORNER CAFÉ  /  DAY "+this.day,{fontFamily:"Arial",fontSize:"14px",fontStyle:"bold",color:"#f4ead0"});
   this.add.rectangle(w/2,h*.82,w,55,0x6f503d);this.add.image(w*.24,h*.5,"counter");this.add.image(w*.76,h*.5,"counter").setScale(.75);
   for(let x=80;x<w-80;x+=115){this.add.rectangle(x,h*.31,82,45,0x765746).setStrokeStyle(3,0x513d31);this.add.text(x,h*.31,"SHELF",{fontSize:"9px",color:"#ead7b1"}).setOrigin(.5);}
   this.player=this.physics.add.sprite(w*.5,h*.7,"person2").setTint(0xd9f56a).setScale(.8);this.player.setCollideWorldBounds(true);
   this.input.keyboard!.createCursorKeys();
   this.info=this.add.text(22,55,"CASH  ₱"+this.cash.toLocaleString()+"    INVENTORY  "+this.inventory,{fontFamily:"Arial",fontSize:"12px",fontStyle:"bold",color:"#3a2b24",backgroundColor:"#f1dfb9",padding:{x:10,y:8}});
   const buy=this.add.text(w*.5,h*.93,this.inventory?"OPEN STORE  •  CUSTOMERS WILL ARRIVE":"BUY 10 COFFEES  •  ₱180",{fontFamily:"Arial",fontSize:"13px",fontStyle:"bold",color:"#182018",backgroundColor:"#d9f56a",padding:{x:16,y:11}}).setOrigin(.5).setInteractive({useHandCursor:true});buy.on("pointerdown",()=>this.inventory?this.openBusiness(buy):this.buy(buy));
   this.add.text(w-22,7,"ESC  BACK",{fontFamily:"Arial",fontSize:"10px",color:"#bcae94"}).setOrigin(1,0).setInteractive().on("pointerdown",()=>this.scene.start("Town"));
   this.input.keyboard!.on("keydown-ESC",()=>this.scene.start("Town"));
 }
 buy(b:Phaser.GameObjects.Text){if(this.cash<180)return this.flash("Not enough cash.");this.cash-=180;this.inventory+=10;this.info.setText("CASH  ₱"+this.cash.toLocaleString()+"    INVENTORY  "+this.inventory);b.setText("OPEN STORE  •  CUSTOMERS WILL ARRIVE");this.flash("Inventory delivered. Open the store.");}
 openBusiness(b:Phaser.GameObjects.Text){b.setText("STORE OPEN  •  CUSTOMER INCOMING");this.time.addEvent({delay:800,callback:()=>this.customerArrives(),loop:true});}
 customerArrives(){if(!this.inventory)return this.flash("You're sold out. Buy more stock.");const c=this.add.circle(this.scale.width*.15,this.scale.height*.7,16,0x577b9a);const label=this.add.text(c.x,c.y-35,"CUSTOMER",{fontSize:"9px",fontStyle:"bold",color:"#382c26"}).setOrigin(.5);this.tweens.add({targets:[c,label],x:this.scale.width*.5,duration:1800,onComplete:()=>{c.setInteractive({useHandCursor:true});c.on("pointerdown",()=>this.sell(c,label));}});}
 sell(c:Phaser.GameObjects.Arc,label:Phaser.GameObjects.Text){if(!this.inventory)return this.flash("Sold out.");this.inventory--;this.cash+=35;this.sales+=35;this.info.setText("CASH  ₱"+this.cash.toLocaleString()+"    INVENTORY  "+this.inventory);this.flash("SALE  +₱35");c.destroy();label.destroy();}
 flash(s:string){const t=this.add.text(this.scale.width/2,this.scale.height*.16,s,{fontFamily:"Arial",fontSize:"15px",fontStyle:"bold",color:"#ffffff",backgroundColor:"#26352b",padding:{x:13,y:9}}).setOrigin(.5).setDepth(20);this.tweens.add({targets:t,alpha:0,y:t.y-20,duration:1400,onComplete:()=>t.destroy()});}
}
export default function PhaserGame({onState}:Props){const ref=useRef<HTMLDivElement>(null);useEffect(()=>{if(!ref.current)return;const game=new Phaser.Game({type:Phaser.AUTO,width:1100,height:700,parent:ref.current,backgroundColor:"#9ccfe2",physics:{default:"arcade",arcade:{debug:false}},scale:{mode:Phaser.Scale.FIT,autoCenter:Phaser.Scale.CENTER_BOTH},scene:[TownScene,StoreScene],render:{antialias:true}});return()=>game.destroy(true);},[]);return <div ref={ref} style={{width:"100%",height:"100%"}}/>}
