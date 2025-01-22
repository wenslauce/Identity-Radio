import { Track } from '@/types/radio';

interface TrackInfoProps {
  track: Track;
}

export const TrackInfo = ({ track }: TrackInfoProps) => {
  return (
    <div className="flex flex-col space-y-1">
      <h3 className="text-xl font-semibold truncate">
        {track.title}
      </h3>
      <p className="text-sm text-muted-foreground truncate">
        {track.artist}
      </p>
    </div>
  );
};