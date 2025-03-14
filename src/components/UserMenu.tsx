
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { LogIn, LogOut, Heart, User, Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export type UserInfo = {
  id: string;
  email?: string;
  full_name?: string;
  avatar_url?: string;
} | null;

const UserMenu = () => {
  const [user, setUser] = useState<UserInfo>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error fetching session:', error);
          return;
        }
        
        if (session?.user) {
          const { id, email, user_metadata } = session.user;
          setUser({
            id,
            email,
            full_name: user_metadata?.full_name || user_metadata?.name || email?.split('@')[0],
            avatar_url: user_metadata?.avatar_url
          });
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUser();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        const { id, email, user_metadata } = session.user;
        setUser({
          id,
          email,
          full_name: user_metadata?.full_name || user_metadata?.name || email?.split('@')[0],
          avatar_url: user_metadata?.avatar_url
        });
      } else {
        setUser(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      toast({
        title: "Signed out successfully",
        description: "You have been signed out of your account.",
      });
      
      navigate('/');
    } catch (error) {
      toast({
        title: "Sign out failed",
        description: error.message || "Could not sign out. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return <Button variant="ghost" size="icon" disabled><User className="h-5 w-5 text-gray-400" /></Button>;
  }

  if (!user) {
    return (
      <Button variant="ghost" asChild className="text-sm">
        <Link to="/auth">
          <LogIn className="h-4 w-4 mr-2" />
          Sign In
        </Link>
      </Button>
    );
  }

  const initials = user.full_name
    ?.split(' ')
    .map(name => name[0])
    .join('')
    .toUpperCase() || '?';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative rounded-full h-8 w-8 p-0">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user.avatar_url || ''} alt={user.full_name || ''} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user.full_name}</p>
            <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to="/favorites" className="cursor-pointer">
            <Heart className="mr-2 h-4 w-4" />
            <span>My Favorites</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/profile" className="cursor-pointer">
            <Settings className="mr-2 h-4 w-4" />
            <span>Profile Settings</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="cursor-pointer" onClick={handleSignOut}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Sign out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserMenu;
