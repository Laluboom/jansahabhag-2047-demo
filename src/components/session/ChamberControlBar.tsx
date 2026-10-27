import React from 'react';
import { cn } from '../../utils/cn';
import { DemoPreviewBadge } from '../ui/DemoPreviewBadge';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Hand,
  MessageSquare,
  Users,
  MoreHorizontal,
  PhoneOff,
} from 'lucide-react';

export interface ChamberControlBarProps {
  participantCount: number;
  isMuted?: boolean;
  isCameraOff?: boolean;
  hasRaisedHand?: boolean;
  onToggleMute?: () => void;
  onToggleCamera?: () => void;
  onToggleHand?: () => void;
  onOpenChat?: () => void;
  onOpenParticipants?: () => void;
  onLeave?: () => void;
  className?: string;
}

export const ChamberControlBar: React.FC<ChamberControlBarProps> = ({
  participantCount,
  isMuted = false,
  isCameraOff = false,
  hasRaisedHand = false,
  onToggleMute,
  onToggleCamera,
  onToggleHand,
  onOpenChat,
  onOpenParticipants,
  onLeave,
  className,
}) => {
  const simulatedTitle = 'Simulated control — this demo has no audio or video';

  const getButtonProps = (
    handler?: () => void,
    defaultTitle?: string
  ) => {
    const isSimulated = !handler;
    return {
      onClick: handler,
      'aria-disabled': isSimulated ? ('true' as const) : undefined,
      title: isSimulated ? simulatedTitle : defaultTitle,
      className: cn(
        'group flex flex-col items-center justify-center gap-0.5 p-1.5 sm:px-2.5 sm:py-1 rounded-lg text-slate-200 transition-colors shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-civic-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900',
        isSimulated
          ? 'opacity-50 cursor-not-allowed hover:bg-transparent'
          : 'hover:bg-slate-800 hover:text-white cursor-pointer'
      ),
    };
  };

  return (
    <div
      role="toolbar"
      aria-label="Chamber controls"
      className={cn(
        'bg-slate-900 text-white border-t border-slate-800 px-2 sm:px-4 py-2 flex items-center justify-between gap-1 sm:gap-3 w-full max-w-full overflow-hidden',
        className
      )}
    >
      {/* Exactly one simulated-controls badge at left edge */}
      <div className="shrink-0 flex items-center">
        <DemoPreviewBadge size="sm" label="Simulated controls" />
      </div>

      {/* Row of icon-above-label controls */}
      <div className="flex items-center gap-1 sm:gap-2 shrink-0">
        {/* Mic */}
        <button
          type="button"
          aria-label={isMuted ? 'Unmute microphone' : 'Mute microphone'}
          {...getButtonProps(onToggleMute, isMuted ? 'Unmute microphone' : 'Mute microphone')}
        >
          {isMuted ? (
            <MicOff className="w-4 h-4 sm:w-5 sm:h-5 text-rose-400" />
          ) : (
            <Mic className="w-4 h-4 sm:w-5 sm:h-5 text-slate-200" />
          )}
          <span className="hidden sm:inline text-[10px] font-medium leading-tight">
            {isMuted ? 'Unmute' : 'Mute'}
          </span>
        </button>

        {/* Camera */}
        <button
          type="button"
          aria-label={isCameraOff ? 'Turn on camera' : 'Turn off camera'}
          {...getButtonProps(onToggleCamera, isCameraOff ? 'Turn on camera' : 'Turn off camera')}
        >
          {isCameraOff ? (
            <VideoOff className="w-4 h-4 sm:w-5 sm:h-5 text-rose-400" />
          ) : (
            <Video className="w-4 h-4 sm:w-5 sm:h-5 text-slate-200" />
          )}
          <span className="hidden sm:inline text-[10px] font-medium leading-tight">
            {isCameraOff ? 'Start Video' : 'Stop Video'}
          </span>
        </button>

        {/* Raise Hand */}
        <button
          type="button"
          aria-label={hasRaisedHand ? 'Lower hand' : 'Raise hand'}
          aria-pressed={Boolean(hasRaisedHand)}
          {...getButtonProps(onToggleHand, hasRaisedHand ? 'Lower hand' : 'Raise hand')}
        >
          <Hand
            className={cn(
              'w-4 h-4 sm:w-5 sm:h-5',
              hasRaisedHand ? 'text-amber-400' : 'text-slate-200'
            )}
          />
          <span className="hidden sm:inline text-[10px] font-medium leading-tight">
            {hasRaisedHand ? 'Lower Hand' : 'Raise Hand'}
          </span>
        </button>

        {/* Chat */}
        <button
          type="button"
          aria-label="Open chat"
          {...getButtonProps(onOpenChat, 'Open chat')}
        >
          <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5 text-slate-200" />
          <span className="hidden sm:inline text-[10px] font-medium leading-tight">
            Chat
          </span>
        </button>

        {/* Participants (with count above the label) */}
        <button
          type="button"
          aria-label={`Participants (${participantCount})`}
          {...getButtonProps(onOpenParticipants, `Participants (${participantCount})`)}
        >
          <div className="flex flex-col items-center">
            <span className="text-[10px] font-bold text-slate-300 leading-none">
              {participantCount}
            </span>
            <Users className="w-4 h-4 sm:w-5 sm:h-5 text-slate-200 mt-0.5" />
          </div>
          <span className="hidden sm:inline text-[10px] font-medium leading-tight">
            Participants
          </span>
        </button>

        {/* More (always simulated / no handler) */}
        <button
          type="button"
          aria-label="More options"
          {...getButtonProps(undefined, 'More options')}
        >
          <MoreHorizontal className="w-4 h-4 sm:w-5 sm:h-5 text-slate-200" />
          <span className="hidden sm:inline text-[10px] font-medium leading-tight">
            More
          </span>
        </button>

        {/* Leave button (rose) */}
        <button
          type="button"
          aria-label="Leave chamber"
          onClick={onLeave}
          aria-disabled={!onLeave ? ('true' as const) : undefined}
          title={!onLeave ? simulatedTitle : 'Leave chamber'}
          className={cn(
            'flex flex-col items-center justify-center gap-0.5 p-1.5 sm:px-3 sm:py-1 rounded-lg text-rose-400 hover:text-white hover:bg-rose-600 transition-colors shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-rose-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900',
            !onLeave && 'opacity-50 cursor-not-allowed hover:bg-transparent hover:text-rose-400'
          )}
        >
          <PhoneOff className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="hidden sm:inline text-[10px] font-medium leading-tight">
            Leave
          </span>
        </button>
      </div>
    </div>
  );
};
