import { Router, Request, Response } from "express";
import { getDb } from "../queries/connection";
import { attendanceEvents } from "@db/schema";

export const webhookRouter = Router();

webhookRouter.post("/jitsi", async (req: Request, res: Response) => {
  try {
    const payload = req.body;
    
    // Validate Jitsi webhook payload
    // Depending on Jitsi configuration, the payload format might vary.
    // Example assumed format:
    // { eventType: "OccupantJoined", roomName: "emtees-slug-123", occupant: { id: "1", name: "User" } }
    
    const eventType = payload.eventType || payload.event_type;
    const roomName = payload.roomName || payload.room_name;
    // We assume the user ID is passed back through the JWT claims or as participant ID
    const userIdStr = payload.occupant?.id || payload.participant?.id;
    
    if (!eventType || !roomName) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    
    // Extract classId from roomName (format: emtees-{slug}-{classId})
    const match = roomName.match(/emtees-.*-(\d+)$/);
    if (!match) {
      return res.status(400).json({ error: "Invalid room name format" });
    }
    
    const classId = parseInt(match[1], 10);
    const userId = userIdStr ? parseInt(userIdStr, 10) : null;
    
    if (!userId || isNaN(userId)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }
    
    let dbEventType: "join" | "leave" | null = null;
    if (eventType === "OccupantJoined" || eventType === "participant_joined") {
      dbEventType = "join";
    } else if (eventType === "OccupantLeft" || eventType === "participant_left") {
      dbEventType = "leave";
    }
    
    if (dbEventType) {
      const db = getDb();
      await db.insert(attendanceEvents).values({
        classId,
        userId,
        eventType: dbEventType,
        timestamp: new Date(),
        metadata: payload,
      });
      // A background job or post-hook will calculate the 20-min logic
    }
    
    res.status(200).json({ success: true });
  } catch (err: any) {
    console.error("[jitsi webhook] error:", err);
    res.status(500).json({ error: err.message });
  }
});
