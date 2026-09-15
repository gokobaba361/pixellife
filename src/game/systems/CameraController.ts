import Phaser from "phaser";
import { Player } from "../entities/Player";
import { CAMERA_LERP, WORLD_HEIGHT, WORLD_WIDTH } from "../config/gameConfig";

export class CameraController {
  constructor(private scene: Phaser.Scene, private player: Player) {}

  setup() {
    const camera = this.scene.cameras.main;
    camera.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    camera.startFollow(this.player, true, CAMERA_LERP, CAMERA_LERP);
  }
}
