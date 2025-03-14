
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Heart, ThumbsUp, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";

type DupeActionsProps = {
  dupeId: string;
  originalProductId: string;
};

// Define interface for user favorites
interface UserFavorite {
  id: string;
  user_id: string;
  dupe_product_id: string;
  original_product_id: string;
  created_at: string;
}

// Define interface for user approvals
interface UserApproval {
  id: string;
  user_id: string;
  dupe_product_id: string;
  original_product_id: string;
  created_at: string;
}

// Define interface for dupe discussions
interface DupeDiscussion {
  id: string;
  user_id: string;
  dupe_product_id: string;
  original_product_id: string;
  message: string;
  created_at: string;
  profiles?: {
    full_name?: string;
    avatar_url?: string;
  };
}

const DupeActions = ({ dupeId, originalProductId }: DupeActionsProps) => {
  const [userId, setUserId] = useState<string | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isApproved, setIsApproved] = useState(false);
  const [approvalCount, setApprovalCount] = useState(0);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<DupeDiscussion[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const checkUserSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setUserId(session.user.id);
          await fetchUserInteractions(session.user.id);
          await fetchApprovalCount();
        }
      } catch (error) {
        console.error("Error checking session:", error);
      } finally {
        setLoading(false);
      }
    };

    checkUserSession();
  }, [dupeId, originalProductId]);

  const fetchUserInteractions = async (userId: string) => {
    try {
      // Check if user has favorited this dupe
      const { data: favoriteData, error: favoriteError } = await supabase
        .rpc('get_user_favorite', {
          user_id_param: userId,
          dupe_id_param: dupeId,
          original_id_param: originalProductId
        });
      
      if (favoriteError) {
        console.error("Error fetching favorite status:", favoriteError);
      } else {
        setIsFavorite(!!favoriteData);
      }

      // Check if user has approved this dupe
      const { data: approvalData, error: approvalError } = await supabase
        .rpc('get_user_approval', {
          user_id_param: userId,
          dupe_id_param: dupeId,
          original_id_param: originalProductId
        });
      
      if (approvalError) {
        console.error("Error fetching approval status:", approvalError);
      } else {
        setIsApproved(!!approvalData);
      }
    } catch (error) {
      console.error("Error fetching user interactions:", error);
    }
  };

  const fetchApprovalCount = async () => {
    try {
      // Count total approvals for this dupe
      const { data: count, error } = await supabase
        .rpc('count_dupe_approvals', {
          dupe_id_param: dupeId,
          original_id_param: originalProductId
        });
      
      if (error) throw error;
      setApprovalCount(count || 0);
    } catch (error) {
      console.error("Error fetching approval count:", error);
    }
  };

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .rpc('get_dupe_discussions', {
          dupe_id_param: dupeId,
          original_id_param: originalProductId
        });
      
      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error("Error fetching messages:", error);
      toast({
        title: "Failed to load messages",
        description: "Couldn't retrieve the discussion for this dupe.",
        variant: "destructive",
      });
    }
  };

  const toggleFavorite = async () => {
    if (!userId) {
      toast({
        title: "Authentication required",
        description: "Please sign in to save favorites.",
        variant: "destructive",
      });
      return;
    }

    try {
      if (isFavorite) {
        // Remove from favorites
        const { error } = await supabase
          .rpc('remove_user_favorite', {
            user_id_param: userId,
            dupe_id_param: dupeId,
            original_id_param: originalProductId
          });
        
        if (error) throw error;
        
        setIsFavorite(false);
        toast({
          title: "Removed from favorites",
          description: "This dupe has been removed from your favorites.",
        });
      } else {
        // Add to favorites
        const { error } = await supabase
          .rpc('add_user_favorite', {
            user_id_param: userId,
            dupe_id_param: dupeId,
            original_id_param: originalProductId
          });
        
        if (error) throw error;
        
        setIsFavorite(true);
        toast({
          title: "Added to favorites",
          description: "This dupe has been added to your favorites.",
        });
      }
    } catch (error) {
      console.error("Error toggling favorite:", error);
      toast({
        title: "Action failed",
        description: "Failed to update favorites. Please try again.",
        variant: "destructive",
      });
    }
  };

  const toggleApproval = async () => {
    if (!userId) {
      toast({
        title: "Authentication required",
        description: "Please sign in to approve dupes.",
        variant: "destructive",
      });
      return;
    }

    try {
      if (isApproved) {
        // Remove approval
        const { error } = await supabase
          .rpc('remove_user_approval', {
            user_id_param: userId,
            dupe_id_param: dupeId,
            original_id_param: originalProductId
          });
        
        if (error) throw error;
        
        setIsApproved(false);
        setApprovalCount(prev => Math.max(0, prev - 1));
        toast({
          title: "Approval removed",
          description: "You've removed your approval for this dupe.",
        });
      } else {
        // Add approval
        const { error } = await supabase
          .rpc('add_user_approval', {
            user_id_param: userId,
            dupe_id_param: dupeId,
            original_id_param: originalProductId
          });
        
        if (error) throw error;
        
        setIsApproved(true);
        setApprovalCount(prev => prev + 1);
        toast({
          title: "Dupe approved",
          description: "You've approved this dupe recommendation.",
        });
      }
    } catch (error) {
      console.error("Error toggling approval:", error);
      toast({
        title: "Action failed",
        description: "Failed to update approval. Please try again.",
        variant: "destructive",
      });
    }
  };

  const openChat = async () => {
    if (!userId) {
      toast({
        title: "Authentication required",
        description: "Please sign in to join discussions.",
        variant: "destructive",
      });
      return;
    }

    await fetchMessages();
    setIsChatOpen(true);
  };

  const handleSendMessage = async () => {
    if (!message.trim() || !userId) return;

    try {
      const { error } = await supabase
        .rpc('add_dupe_discussion', {
          user_id_param: userId,
          dupe_id_param: dupeId,
          original_id_param: originalProductId,
          message_param: message.trim()
        });
      
      if (error) throw error;
      
      setMessage("");
      await fetchMessages();
      toast({
        title: "Message sent",
        description: "Your message has been added to the discussion.",
      });
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Failed to send message",
        description: "Your message couldn't be sent. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Don't show any actions if user is not logged in and loading is complete
  if (!userId && !loading) {
    return null;
  }

  if (loading) {
    return (
      <div className="flex gap-2 items-center justify-center mt-2">
        <div className="h-9 w-9 rounded-full bg-gray-100 animate-pulse"></div>
        <div className="h-9 w-9 rounded-full bg-gray-100 animate-pulse"></div>
        <div className="h-9 w-9 rounded-full bg-gray-100 animate-pulse"></div>
      </div>
    );
  }

  return (
    <>
      <div className="flex gap-2 items-center justify-center mt-2">
        <Button
          onClick={toggleFavorite}
          variant="ghost"
          size="icon"
          aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
          className={`rounded-full ${isFavorite ? 'text-red-500 hover:text-red-600 hover:bg-red-50' : 'text-gray-500 hover:text-red-500 hover:bg-red-50'}`}
        >
          <Heart className="h-5 w-5" fill={isFavorite ? "currentColor" : "none"} />
        </Button>

        <Button
          onClick={toggleApproval}
          variant="ghost"
          size="icon"
          aria-label={isApproved ? "Remove approval" : "Approve this dupe"}
          className={`rounded-full ${isApproved ? 'text-green-500 hover:text-green-600 hover:bg-green-50' : 'text-gray-500 hover:text-green-500 hover:bg-green-50'}`}
        >
          <ThumbsUp className="h-5 w-5" fill={isApproved ? "currentColor" : "none"} />
          {approvalCount > 0 && (
            <span className="ml-1 text-xs font-semibold">{approvalCount}</span>
          )}
        </Button>

        <Button
          onClick={openChat}
          variant="ghost"
          size="icon"
          aria-label="Open discussion"
          className="rounded-full text-gray-500 hover:text-violet-500 hover:bg-violet-50"
        >
          <MessageSquare className="h-5 w-5" />
        </Button>
      </div>

      <Dialog open={isChatOpen} onOpenChange={setIsChatOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Dupe Discussion</DialogTitle>
            <DialogDescription>
              Share your thoughts about this dupe with the community.
            </DialogDescription>
          </DialogHeader>
          
          <ScrollArea className="h-[300px] rounded-md border p-4">
            {messages.length > 0 ? (
              <div className="space-y-4">
                {messages.map((msg) => (
                  <div key={msg.id} className="flex gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={msg.profiles?.avatar_url || ''} />
                      <AvatarFallback>
                        {msg.profiles?.full_name?.charAt(0) || '?'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex justify-between">
                        <p className="text-sm font-medium">{msg.profiles?.full_name || 'Anonymous'}</p>
                        <time className="text-xs text-gray-400">
                          {new Date(msg.created_at).toLocaleDateString()}
                        </time>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{msg.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Be the first to start this discussion!</p>
              </div>
            )}
          </ScrollArea>
          
          <div className="flex gap-2 items-center">
            <Input
              placeholder="Type your message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              className="flex-1"
            />
            <Button onClick={handleSendMessage} disabled={!message.trim()}>
              Send
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default DupeActions;
