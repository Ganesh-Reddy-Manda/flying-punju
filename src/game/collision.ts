import { GAME_CONFIG } from '../config/gameConfig';
import { PunjuPlayer } from './punju';
import { Obstacle } from './obstacles';
import { Collectible } from './collectibles';

export interface CollisionResult {
  hitObstacle: boolean;
  hitObstacleIndex: number;
  hitGround: boolean;
  nearMiss: boolean;
  collectedItems: Collectible[];
}

export class CollisionSystem {
  /**
   * Circle vs Rectangle collision test
   */
  public static testCircleRect(
    cx: number,
    cy: number,
    radius: number,
    rx: number,
    ry: number,
    rw: number,
    rh: number
  ): boolean {
    // Find closest point on rectangle to circle center
    const closestX = Math.max(rx, Math.min(cx, rx + rw));
    const closestY = Math.max(ry, Math.min(cy, ry + rh));

    // Calculate distance from circle center to closest point
    const dx = cx - closestX;
    const dy = cy - closestY;

    return dx * dx + dy * dy < radius * radius;
  }

  /**
   * Circle vs Circle collision test
   */
  public static testCircleCircle(
    c1x: number,
    c1y: number,
    r1: number,
    c2x: number,
    c2y: number,
    r2: number
  ): boolean {
    const dx = c1x - c2x;
    const dy = c1y - c2y;
    const distSq = dx * dx + dy * dy;
    const radSum = r1 + r2;
    return distSq < radSum * radSum;
  }

  /**
   * Perform full world collision evaluation
   */
  public static evaluate(
    player: PunjuPlayer,
    obstacles: Obstacle[],
    collectibles: Collectible[]
  ): CollisionResult {
    const result: CollisionResult = {
      hitObstacle: false,
      hitObstacleIndex: -1,
      hitGround: false,
      nearMiss: false,
      collectedItems: [],
    };

    const groundY = GAME_CONFIG.canvasHeight * 0.85;

    // 1. Ground collision
    if (player.y + player.radius >= groundY) {
      result.hitGround = true;
      return result;
    }

    // 2. Ceiling boundary limit (keep player on screen)
    if (player.y - player.radius < 0) {
      player.y = player.radius;
      player.velocity = 0;
    }

    // 3. Obstacle collisions
    for (let i = 0; i < obstacles.length; i++) {
      const obs = obstacles[i];
      if (obs.destroyed) continue;

      // Top tower collision
      const hitTop = this.testCircleRect(
        player.x,
        player.y,
        player.radius,
        obs.x,
        0,
        obs.width,
        obs.topHeight
      );

      // Bottom tower collision
      const bottomHeight = groundY - obs.bottomY;
      const hitBottom = this.testCircleRect(
        player.x,
        player.y,
        player.radius,
        obs.x,
        obs.bottomY,
        obs.width,
        bottomHeight
      );

      // Pan hazard collision if present
      let hitPan = false;
      if (obs.hasPanHazard && obs.panY !== undefined) {
        const panBob = obs.panY + Math.sin(obs.panSway || 0) * 12;
        hitPan = this.testCircleCircle(
          player.x,
          player.y,
          player.radius,
          obs.x + obs.width / 2,
          panBob,
          13
        );
      }

      if (hitTop || hitBottom || hitPan) {
        result.hitObstacle = true;
        result.hitObstacleIndex = i;
        break;
      }

      // 4. Near-miss detection (Balayya "MASS!" bonus)
      // Check if player is directly within the X-span of the obstacle and within 18px of either tower edge
      if (
        !obs.nearMissAwarded &&
        player.x > obs.x &&
        player.x < obs.x + obs.width
      ) {
        const distToTopEdge = player.y - player.radius - obs.topHeight;
        const distToBottomEdge = obs.bottomY - (player.y + player.radius);

        if (
          (distToTopEdge > 0 && distToTopEdge < 18) ||
          (distToBottomEdge > 0 && distToBottomEdge < 18)
        ) {
          result.nearMiss = true;
          obs.nearMissAwarded = true;
        }
      }
    }

    // 5. Collectibles collision
    for (const item of collectibles) {
      if (item.collected) continue;
      const bobY = item.y + Math.sin(item.bobOffset) * 4;
      if (
        this.testCircleCircle(
          player.x,
          player.y,
          player.radius + 4,
          item.x,
          bobY,
          item.radius
        )
      ) {
        item.collected = true;
        result.collectedItems.push(item);
      }
    }

    return result;
  }
}
