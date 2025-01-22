import { ChatSection } from "@/components/ChatSection";
import { SongRequest } from "@/components/SongRequest";
import { UsernameForm } from "@/components/UsernameForm";
import { MainNav } from "@/components/MainNav";
import { Footer } from "@/components/Footer";
import { useChatSession } from "@/hooks/useChatSession";
import { RadioPlayer } from "@/components/RadioPlayer";

const Index = () => {
  const { user, isLoading, registerUsername } = useChatSession();

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-background to-purple-900/20 p-4 md:p-8 flex flex-col">
      <MainNav />
      <div className="max-w-7xl mx-auto space-y-8 flex-grow">
        <div className="glass rounded-2xl p-6 md:p-8 shadow-xl backdrop-blur-lg border border-white/10">
          <div className="mb-12">
            <RadioPlayer />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8">
              {isLoading ? (
                <div className="glass rounded-xl p-4 h-[400px] flex items-center justify-center">
                  <p>Loading...</p>
                </div>
              ) : user ? (
                <ChatSection currentUser={user} />
              ) : (
                <UsernameForm onSubmit={registerUsername} />
              )}
            </div>
            <div className="lg:col-span-4">
              <SongRequest />
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Index;