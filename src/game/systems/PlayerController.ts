import Phaser from "phaser";
import { Player, type Direction } from "../entities/Player";
import { PLAYER_SPEED } from "../config/gameConfig";

export interface InputVector {
  x: number;
  y: number;
}

export interface InputSource {
  getVector(): InputVector;
}

type WasdKeys = Record<"up" | "down" | "left" | "right", Phaser.Input.Keyboard.Key>;

export class KeyboardInputSource implements InputSource {
  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd?: WasdKeys;

  constructor(scene: Phaser.Scene) {
    this.cursors = scene.input.keyboard?.createCursorKeys();
    this.wasd = scene.input.keyboard?.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
    }) as WasdKeys;
  }

  getVector(): InputVector {
    const left = this.cursors?.left.isDown || this.wasd?.left.isDown;
    const right = this.cursors?.right.isDown || this.wasd?.right.isDown;
    const up = this.cursors?.up.isDown || this.wasd?.up.isDown;
    const down = this.cursors?.down.isDown || this.wasd?.down.isDown;

    let x = 0;
    let y = 0;
    if (left) x -= 1;
    if (right) x += 1;
    if (up) y -= 1;
    if (down) y += 1;
    return { x, y };
  }
}

export class PlayerController {
  constructor(private player: Player, private inputSource: InputSource) {}

  update(time: number) {
    const raw = this.inputSource.getVector();
    let x = raw.x;
    let y = raw.y;
    const length = Math.hypot(x, y);
    const moving = length > 0;
    if (moving) {
      x /= length;
      y /= length;
    }

    this.player.setVelocity(x * PLAYER_SPEED, y * PLAYER_SPEED);

    if (moving) {
      const direction: Direction = Math.abs(x) > Math.abs(y)
        ? (x > 0 ? "right" : "left")
        : (y > 0 ? "down" : "up");
      this.player.setDirection(direction);
    }
    this.player.applyBob(time, moving);
  }
}
