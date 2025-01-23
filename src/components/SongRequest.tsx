import { SongRequestForm } from './song-request/SongRequestForm';
import { SongRequestList } from './song-request/SongRequestList';

export const SongRequest = () => {
  return (
    <div className="glass rounded-xl p-4 space-y-6">
      <h2 className="text-xl font-semibold mb-4">Request a Song</h2>
      <SongRequestForm />
      <SongRequestList />
    </div>
  );
};