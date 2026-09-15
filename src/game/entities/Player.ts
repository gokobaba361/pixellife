import Phaser from "phaser";

export type Direction = "up" | "down" | "left" | "right";

export class Player extends Phaser.Physics.Arcade.Sprite {
  private direction: Direction = "down";
  private baseScaleX = 1;
  private baseScaleY = 1;

  constructor(scene: Phaser.Scene, x: number, y: number, texture: string) {
    super(scene, x, y, texture);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setCollideWorldBounds(true);
    this.setDepth(5);
  }

  setBaseScale(scale: number) {
    this.baseScaleX = scale;
    this.baseScaleY = scale;
    this.setScale(scale);
  }

  getDirection(): Direction {
    return this.direction;
  }

  setDirection(direction: Direction) {
    if (this.direction === direction) return;
    this.direction = direction;
    this.setFlipX(direction === "left");
  }

  applyBob(time: number, moving: boolean) {
    if (!moving) {
      this.setScale(this.baseScaleX, this.baseScaleY);
      return;
    }
    const bob = Math.sin(time / 90) * 0.05;
    this.setScale(this.baseScaleX, this.baseScaleY + bob * this.baseScaleY);
  }
}
