import { useState, useRef, useEffect } from "react";
import { trpc } from "@/providers/trpc";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Send,
  Paperclip,
  Mic,
  X,
  Megaphone,
  ArrowLeft,
  FileText,
  Square,
  Info,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function ChatPage() {
  const { user } = useAuth();
  const utils = trpc.useUtils();
  const [selectedBatch, setSelectedBatch] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [replyToId, setReplyToId] = useState<number | null>(null);
  const [replyToContent, setReplyToContent] = useState<string>("");
  const [isAnnouncement, setIsAnnouncement] = useState(false);
  const [groupInfoOpen, setGroupInfoOpen] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);

  // Voice recording states
  const [isRecording, setIsRecording] = useState(false);
  const [recordTime, setRecordTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<any>(null);

  // File attachment states
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<{
    name: string;
    dataUrl: string;
    type: "image" | "video" | "pdf";
  } | null>(null);

  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    };
  }, []);

  const messagesQuery = trpc.learning.listMessages.useQuery(
    { batchId: selectedBatch || 0, limit: 50, offset: 0 },
    { enabled: !!selectedBatch, refetchInterval: 1500 }
  );

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messagesQuery?.data, selectedBatch]);

  const sendMessage = trpc.learning.sendMessage.useMutation({
    onMutate: async newMsg => {
      await utils.learning.listMessages.cancel({
        batchId: selectedBatch || 0,
        limit: 50,
        offset: 0,
      });
      const previousMessages = utils.learning.listMessages.getData({
        batchId: selectedBatch || 0,
        limit: 50,
        offset: 0,
      });

      if (previousMessages) {
        const optimisticMsg = {
          id: Date.now(),
          batchId: newMsg.batchId,
          senderId: user?.id || 0,
          content: newMsg.content,
          type: newMsg.type || "text",
          mediaUrl: newMsg.mediaUrl || null,
          replyToId: newMsg.replyToId || null,
          reactions: {},
          isAnnouncement: newMsg.isAnnouncement || false,
          createdAt: new Date(),
          sender: {
            id: user?.id || 0,
            name: user?.name || "Me",
            role: user?.role || "student",
          },
        };
        utils.learning.listMessages.setData(
          { batchId: selectedBatch || 0, limit: 50, offset: 0 },
          [optimisticMsg, ...previousMessages] as any
        );
      }

      setMessage("");
      setReplyToId(null);
      setReplyToContent("");
      setIsAnnouncement(false);

      return { previousMessages };
    },
    onError: (err, _newMsg, context) => {
      if (context?.previousMessages) {
        utils.learning.listMessages.setData(
          { batchId: selectedBatch || 0, limit: 50, offset: 0 },
          context.previousMessages
        );
      }
      toast.error(err.message);
    },
    onSuccess: () => {
      messagesQuery.refetch();
    },
  });

  const isAdmin = ["super_admin", "admin", "academic_head"].includes(
    user?.role || ""
  );
  const isTeacherOrAdmin = isAdmin || user?.role === "teacher";

  const myBatches = trpc.user.myBatches.useQuery(undefined, {
    enabled: !isAdmin,
  });
  const allBatches = trpc.learning.listBatches.useQuery(undefined, {
    enabled: isAdmin,
  });

  const batchList = (
    isAdmin
      ? allBatches.data?.map(b => ({ batchId: b.id, batch: b }))
      : user?.role === "teacher"
        ? (myBatches.data as any)?.map((b: any) => ({
            batchId: b.id,
            batch: b,
          }))
        : myBatches.data
  ) as { batchId: number; batch: any }[] | undefined;

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      audioChunksRef.current = [];

      recorder.ondataavailable = e => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/webm",
        });
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64data = reader.result as string;
          sendMessage.mutate({
            batchId: selectedBatch!,
            content: "Voice Message",
            type: "voice",
            mediaUrl: base64data,
            replyToId: replyToId ?? undefined,
            isAnnouncement,
          });
        };
        reader.readAsDataURL(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
      setRecordTime(0);
      recordingTimerRef.current = setInterval(() => {
        setRecordTime(t => t + 1);
      }, 1000);
    } catch (err) {
      toast.error("Microphone permission denied or not available");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.onstop = () => {}; // cancel send on stop
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream
        .getTracks()
        .forEach(track => track.stop());
      setIsRecording(false);
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      toast.info("Recording cancelled");
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size exceeds 10MB limit");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result as string;
      let fileType: "image" | "video" | "pdf" = "pdf";
      if (file.type.startsWith("image/")) {
        fileType = "image";
      } else if (file.type.startsWith("video/")) {
        fileType = "video";
      }
      setSelectedFile({
        name: file.name,
        dataUrl,
        type: fileType,
      });
    };
    reader.readAsDataURL(file);
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBatch) return;

    if (selectedFile) {
      sendMessage.mutate({
        batchId: selectedBatch,
        content: selectedFile.name,
        type: selectedFile.type,
        mediaUrl: selectedFile.dataUrl,
        replyToId: replyToId ?? undefined,
        isAnnouncement,
      });
      setSelectedFile(null);
      return;
    }

    if (!message.trim()) return;
    sendMessage.mutate({
      batchId: selectedBatch,
      content: message,
      type: "text",
      replyToId: replyToId ?? undefined,
      isAnnouncement,
    });
  };

  const handleReply = (msg: any) => {
    setReplyToId(msg.id);
    setReplyToContent(msg.content);
  };

  const selectedBatchObj = isAdmin
    ? allBatches.data?.find(b => b.id === selectedBatch)
    : user?.role === "teacher"
      ? (myBatches.data as any)?.find((b: any) => b.id === selectedBatch)
      : (myBatches.data as any)?.find((e: any) => e.batchId === selectedBatch)
          ?.batch;

  const selectedBatchName = selectedBatchObj
    ? `${selectedBatchObj.name} - ${selectedBatchObj.module?.name || ""}`
    : "";

  // On mobile: show batch list OR chat, not both
  const showBatchList = !selectedBatch;

  return (
    <div className="flex h-[calc(100vh-8rem)] md:h-[calc(100vh-9rem)] gap-0 md:gap-4 -mx-4 md:mx-0 -mt-4 md:mt-0">
      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept="image/*,video/*,application/pdf"
      />

      {/* Batch list — full width on mobile when no batch selected, sidebar on desktop */}
      <div
        className={`
        ${showBatchList ? "flex" : "hidden"} md:flex
        flex-col bg-white border-r
        w-full md:w-64 shrink-0
      `}
      >
        <div className="px-4 py-3 border-b">
          <p className="text-sm font-semibold text-gray-700">
            {isAdmin ? "All Batches" : "My Batches"}
          </p>
        </div>
        <div className="flex-1 overflow-y-auto">
          {batchList?.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-8">
              No batches found
            </p>
          )}
          {batchList?.map(enrollment => (
            <button
              key={enrollment.batchId}
              onClick={() => setSelectedBatch(enrollment.batchId)}
              className={`w-full text-left px-4 py-3 border-b hover:bg-gray-50 transition-colors ${
                selectedBatch === enrollment.batchId
                  ? "bg-emerald-50 border-l-4 border-l-emerald-500"
                  : ""
              }`}
            >
              <p className="font-medium text-sm">
                {enrollment.batch?.name} - {enrollment.batch?.module?.name}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Chat area — full width on mobile when batch selected */}
      <div
        className={`
        ${!showBatchList ? "flex" : "hidden"} md:flex
        flex-col flex-1 bg-white min-w-0
      `}
      >
        {selectedBatch ? (
          <>
            {/* Chat header */}
            <div className="flex items-center gap-3 px-4 py-3 border-b shrink-0">
              {/* Back button — mobile only */}
              <button
                className="md:hidden p-1 rounded hover:bg-gray-100"
                onClick={() => setSelectedBatch(null)}
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">
                  {selectedBatchName}
                </p>
              </div>
              {isAdmin && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setGroupInfoOpen(true)}
                  className="h-8 w-8 p-0"
                  title="Group Info"
                >
                  <Info className="w-4 h-4 text-gray-500 hover:text-gray-700" />
                </Button>
              )}
              <Badge variant="outline" className="text-xs shrink-0">
                {messagesQuery.data?.length || 0}
              </Badge>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-3">
              <div className="space-y-2">
                {messagesQuery.data
                  ?.slice()
                  .reverse()
                  .map(msg => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.senderId === user?.id ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[80%] md:max-w-[70%] rounded-2xl px-3 py-2 text-sm cursor-pointer ${
                          msg.senderId === user?.id
                            ? "bg-emerald-600 text-white rounded-br-sm"
                            : "bg-gray-100 text-gray-800 rounded-bl-sm"
                        } ${(msg as any).isAnnouncement ? "border-2 border-yellow-400" : ""}`}
                        onClick={() => handleReply(msg)}
                      >
                        {msg.senderId !== user?.id && (
                          <p className="text-xs font-semibold mb-1 opacity-80">
                            {msg.sender?.name}
                          </p>
                        )}
                        {(msg as any).isAnnouncement && (
                          <span className="text-xs mr-1">📢</span>
                        )}
                        {(msg as any).replyToId && (
                          <div
                            className={`text-xs mb-1 px-2 py-1 rounded opacity-70 ${
                              msg.senderId === user?.id
                                ? "bg-emerald-700"
                                : "bg-gray-200"
                            }`}
                          >
                            ↩ Replying to a message
                          </div>
                        )}

                        {/* Display content based on type */}
                        {msg.type === "voice" ? (
                          <div className="my-1">
                            <audio
                              src={msg.mediaUrl || undefined}
                              controls
                              className="max-w-full rounded"
                            />
                          </div>
                        ) : msg.type === "image" ? (
                          <div className="my-1">
                            <img
                              src={msg.mediaUrl || undefined}
                              alt={msg.content}
                              className="max-w-full max-h-60 rounded object-contain border bg-black/5"
                            />
                          </div>
                        ) : msg.type === "video" ? (
                          <div className="my-1">
                            <video
                              src={msg.mediaUrl || undefined}
                              controls
                              className="max-w-full max-h-60 rounded"
                            />
                          </div>
                        ) : msg.type === "pdf" ? (
                          <div className="my-1">
                            <a
                              href={msg.mediaUrl || undefined}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={`flex items-center gap-1.5 font-medium underline ${
                                msg.senderId === user?.id
                                  ? "text-emerald-100 hover:text-white"
                                  : "text-emerald-600 hover:text-emerald-700"
                              }`}
                            >
                              <FileText className="w-4 h-4 shrink-0" />
                              <span className="truncate max-w-[200px]">
                                {msg.content}
                              </span>
                            </a>
                          </div>
                        ) : (
                          <p className="break-words">{msg.content}</p>
                        )}

                        {(msg as any).reactions &&
                          Object.keys((msg as any).reactions).length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {Object.entries(
                                (msg as any).reactions as Record<
                                  string,
                                  number[]
                                >
                              ).map(([emoji, users]) => (
                                <span
                                  key={emoji}
                                  className="text-xs bg-white/20 rounded-full px-1.5 py-0.5"
                                >
                                  {emoji} {users.length}
                                </span>
                              ))}
                            </div>
                          )}
                        <p
                          className={`text-[10px] mt-0.5 ${msg.senderId === user?.id ? "text-emerald-100" : "text-gray-400"}`}
                        >
                          {msg.createdAt
                            ? new Date(msg.createdAt).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : ""}
                        </p>
                      </div>
                    </div>
                  ))}
                {messagesQuery.data?.length === 0 && (
                  <p className="text-center text-gray-400 py-10 text-sm">
                    No messages yet. Start the conversation!
                  </p>
                )}
                <div ref={scrollRef} />
              </div>
            </ScrollArea>

            {/* Input area */}
            <div className="p-3 border-t shrink-0">
              {replyToId && (
                <div className="flex items-center justify-between bg-gray-100 rounded-lg px-3 py-1.5 mb-2 text-sm">
                  <span className="text-gray-600 truncate text-xs">
                    ↩ {replyToContent}
                  </span>
                  <button
                    onClick={() => {
                      setReplyToId(null);
                      setReplyToContent("");
                    }}
                    className="ml-2 shrink-0"
                  >
                    <X className="w-3 h-3 text-gray-500" />
                  </button>
                </div>
              )}

              {/* Selected file preview */}
              {selectedFile && (
                <div className="flex items-center justify-between bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-1.5 mb-2 text-sm">
                  <div className="flex items-center gap-2 truncate">
                    <FileText className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="text-emerald-800 text-xs truncate font-medium">
                      {selectedFile.name}
                    </span>
                    <Badge
                      variant="secondary"
                      className="text-[10px] uppercase shrink-0"
                    >
                      {selectedFile.type}
                    </Badge>
                  </div>
                  <button
                    onClick={() => setSelectedFile(null)}
                    className="ml-2 shrink-0"
                  >
                    <X className="w-3.5 h-3.5 text-emerald-600 hover:text-emerald-800" />
                  </button>
                </div>
              )}

              {isRecording ? (
                /* Voice recording controls */
                <div className="flex items-center justify-between bg-red-50 border border-red-100 rounded-xl px-4 py-2 text-sm animate-pulse">
                  <div className="flex items-center gap-2 text-red-600">
                    <span className="relative flex h-2 w-2 shrink-0">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                    </span>
                    <span className="font-semibold text-xs">
                      Recording Voice...
                    </span>
                    <span className="font-mono text-xs font-medium">
                      {Math.floor(recordTime / 60)}:
                      {(recordTime % 60).toString().padStart(2, "0")}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={cancelRecording}
                      className="text-gray-500 hover:text-gray-700 h-8 px-2.5 text-xs font-semibold"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      onClick={stopRecording}
                      className="bg-red-600 hover:bg-red-700 text-white h-8 px-3 text-xs font-semibold flex items-center gap-1"
                    >
                      <Square className="w-3 h-3" /> Stop & Send
                    </Button>
                  </div>
                </div>
              ) : (
                /* Standard Message Form */
                <form
                  onSubmit={handleSend}
                  className="flex items-center gap-1.5"
                >
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={triggerFileSelect}
                    className="w-8 h-8 shrink-0 hover:bg-gray-100"
                    title="Attach File"
                  >
                    <Paperclip className="w-4 h-4 text-gray-500" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={startRecording}
                    className="w-8 h-8 shrink-0 hover:bg-gray-100"
                    title="Record Voice"
                  >
                    <Mic className="w-4 h-4 text-gray-500" />
                  </Button>
                  <Input
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    placeholder={
                      selectedFile
                        ? "File selected. Press send to upload..."
                        : "Type a message..."
                    }
                    disabled={!!selectedFile}
                    className="flex-1 text-sm"
                  />
                  {isTeacherOrAdmin && (
                    <Button
                      type="button"
                      size="icon"
                      variant={isAnnouncement ? "default" : "outline"}
                      className={`w-8 h-8 shrink-0 ${isAnnouncement ? "bg-yellow-500 hover:bg-yellow-600 border-yellow-500" : ""}`}
                      onClick={() => setIsAnnouncement(!isAnnouncement)}
                      title="Announce"
                    >
                      <Megaphone className="w-4 h-4" />
                    </Button>
                  )}
                  <Button
                    type="submit"
                    size="icon"
                    className="bg-emerald-600 hover:bg-emerald-700 w-9 h-9 shrink-0"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </form>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            <p className="text-sm">Select a batch to start chatting</p>
          </div>
        )}
      </div>
      {/* Group Info Dialog */}
      <Dialog open={groupInfoOpen} onOpenChange={setGroupInfoOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Group Info</DialogTitle>
          </DialogHeader>
          {selectedBatchObj && (
            <div className="space-y-4 mt-2 text-sm">
              <div className="bg-gray-50 p-3 rounded-lg space-y-2">
                <div>
                  <p className="text-xs text-gray-500 font-medium uppercase">
                    Batch Name
                  </p>
                  <p className="font-semibold text-gray-800">
                    {selectedBatchObj.name}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium uppercase">
                    Course (Module)
                  </p>
                  <p className="font-semibold text-gray-800">
                    {selectedBatchObj.module?.name || "-"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium uppercase">
                    Teacher
                  </p>
                  <p className="font-semibold text-gray-800">
                    {selectedBatchObj.teacher?.name || "Not assigned"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium uppercase">
                    Time Slot
                  </p>
                  <p className="font-semibold text-gray-800">
                    {selectedBatchObj.timeSlot || "Not set"}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-xs text-gray-500 font-medium uppercase mb-2">
                  Enrolled Students (
                  {(selectedBatchObj as any).enrollments?.length || 0})
                </p>
                <div className="border rounded-md max-h-60 overflow-y-auto bg-white divide-y font-sans">
                  {((selectedBatchObj as any).enrollments || []).map(
                    (e: any) => (
                      <div
                        key={e.id}
                        className="p-2.5 flex items-center justify-between"
                      >
                        <div className="truncate mr-2">
                          <p className="font-medium text-gray-800 text-xs">
                            {e.student?.name}
                          </p>
                          <p className="text-[10px] text-gray-400 font-mono">
                            {e.student?.profile?.studentId ||
                              `ID: ${e.studentId}`}
                          </p>
                        </div>
                      </div>
                    )
                  )}
                  {(!(selectedBatchObj as any).enrollments ||
                    (selectedBatchObj as any).enrollments.length === 0) && (
                    <p className="text-xs text-gray-400 italic text-center py-4">
                      No students enrolled
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
