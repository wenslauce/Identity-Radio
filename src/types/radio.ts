export interface Track {
  title: string;
  artist: string;
  coverUrl?: string;
}

export interface RadioPlayerProps {
  streamUrl?: string;
  radioName?: string;
}