import AudioPlayer, { AudioPlayerRef } from "@components/AudioPlayer";
import avatar from "@assets/images/user/avatar-3.jpg";
import { TRANSCRIPTION_SPEAKER_1 } from "@page-modules/ai-ml/analysis/constants";
import type { Transcription } from "@page-modules/ai-ml/analysis/types";
import React, { RefObject } from "react";
import { Alert, Button, Col, Row, Spinner } from "react-bootstrap";

type Props = Readonly<{
  chunksAnalysisData: any;
  uuid: string;
  mediaPlayerShow: boolean;
  audioLoading: boolean;
  audioError: string | null;
  setAudioError: (v: string | null) => void;
  audioPlayerRef: RefObject<AudioPlayerRef | null>;
  getAudioFilePath: () => string;
  loadAuthenticatedAudio: () => Promise<void>;
  playingSegment: { start: number; end: number } | null;
  onTimeClick: (start: number, end: number) => void;
  onStopAudio: () => void;
}>;

function isPlayingSegment(
  playingSegment: { start: number; end: number } | null,
  item: Transcription,
): boolean {
  return (
    playingSegment?.start === item.start &&
    playingSegment?.end === item.end
  );
}

function hasPlayableTimestamps(item: Transcription): boolean {
  return item?.start != null && item?.end != null;
}

function renderMediaPlayerSection(props: {
  audioLoading: boolean;
  audioError: string | null;
  setAudioError: (v: string | null) => void;
  loadAuthenticatedAudio: () => Promise<void>;
  mediaPlayerShow: boolean;
  audioPlayerRef: RefObject<AudioPlayerRef | null>;
  getAudioFilePath: () => string;
  uuid: string;
}): React.ReactNode {
  const {
    audioLoading,
    audioError,
    setAudioError,
    loadAuthenticatedAudio,
    mediaPlayerShow,
    audioPlayerRef,
    getAudioFilePath,
    uuid,
  } = props;

  if (audioLoading) {
    return (
      <div className="text-center p-4">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading audio...</span>
        </Spinner>
        <p className="mt-2">Loading audio file...</p>
      </div>
    );
  }

  if (audioError) {
    return (
      <Alert variant="warning" className="text-center">
        <Alert.Heading>Audio Loading Error</Alert.Heading>
        <p>{audioError}</p>
        <hr />
        <div className="d-flex justify-content-end gap-2">
          <Button
            variant="outline-warning"
            size="sm"
            onClick={() => {
              setAudioError(null);
              void loadAuthenticatedAudio();
            }}
          >
            Retry
          </Button>
        </div>
      </Alert>
    );
  }

  if (mediaPlayerShow) {
    return (
      <AudioPlayer
        ref={audioPlayerRef}
        audioSrc={getAudioFilePath()}
        title={`Call Recording - ${uuid}`}
        showWaveform={false}
      />
    );
  }

  return (
    <Alert variant="info" className="text-center">
      <Alert.Heading>No Audio Available</Alert.Heading>
      <p>Audio file is not available for this call recording.</p>
    </Alert>
  );
}

type TranscriptPlayStopButtonProps = Readonly<{
  transcriptItem: Transcription;
  playingSegment: { start: number; end: number } | null;
  mediaPlayerShow: boolean;
  onTimeClick: (start: number, end: number) => void;
  onStopAudio: () => void;
  variant: "in" | "out";
}>;

function TranscriptPlayStopButton({
  transcriptItem,
  playingSegment,
  mediaPlayerShow,
  onTimeClick,
  onStopAudio,
  variant,
}: TranscriptPlayStopButtonProps) {
  const showControls =
    hasPlayableTimestamps(transcriptItem) && Boolean(mediaPlayerShow);

  if (!showControls) {
    return null;
  }

  const isActive = isPlayingSegment(playingSegment, transcriptItem);
  const iconClass = isActive ? "ti-player-pause" : "ti-player-play";
  const label = isActive ? "Stop" : "Listen";

  const handleActivate = () => {
    if (isActive) {
      onStopAudio();
    } else if (transcriptItem.start != null && transcriptItem.end != null) {
      onTimeClick(transcriptItem.start, transcriptItem.end);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleActivate();
    }
  };

  const isOut = variant === "out";
  const paragraphClass = isOut ? "text-white mb-0" : "text-primary mb-0";
  const buttonClass = [
    "btn",
    "btn-link",
    "p-0",
    "mb-0",
    "text-decoration-none",
    "time-stamp",
    "cursor-pointer",
    isOut ? "text-white time-stamp-padding" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <p className={paragraphClass}>
      <button
        type="button"
        className={buttonClass}
        onClick={handleActivate}
        onKeyDown={handleKeyDown}
        aria-label={label}
      >
        <i className={`ti ${iconClass}`} title={label} aria-hidden />
        {label}
      </button>
    </p>
  );
}

type TranscriptLineItemProps = Readonly<{
  transcriptItem: Transcription;
  playingSegment: { start: number; end: number } | null;
  mediaPlayerShow: boolean;
  onTimeClick: (start: number, end: number) => void;
  onStopAudio: () => void;
}>;

function TranscriptLineItem({
  transcriptItem,
  playingSegment,
  mediaPlayerShow,
  onTimeClick,
  onStopAudio,
}: TranscriptLineItemProps) {
  const isSpeaker1 = transcriptItem.speaker === TRANSCRIPTION_SPEAKER_1;

  if (isSpeaker1) {
    return (
      <div>
        <Row>
          <Col md={6}>
            <div className="message-in">
              <div className="d-flex">
                <div className="flex-shrink-0">
                  <div className="chat-avtar">
                    <img
                      className="rounded-circle img-fluid wid-40"
                      src={avatar.src}
                      alt="Customer"
                    />
                    <i className="chat-badge bg-success"></i>
                  </div>
                </div>
                <div className="flex-grow-1 mx-3">
                  <div className="d-flex align-items-start flex-column">
                    <div className="message d-flex align-items-start flex-column">
                      <div className="d-flex align-items-center mb-1 chat-msg">
                        <div className="flex-grow-1 me-3">
                          <div className="msg-content card mb-0">
                            <p className="mb-0">{transcriptItem.text}</p>
                            <TranscriptPlayStopButton
                              transcriptItem={transcriptItem}
                              playingSegment={playingSegment}
                              mediaPlayerShow={mediaPlayerShow}
                              onTimeClick={onTimeClick}
                              onStopAudio={onStopAudio}
                              variant="in"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Col>
        </Row>
      </div>
    );
  }

  return (
    <div>
      <Row>
        <Col md={6}></Col>
        <Col md={6}>
          <div className="message-out">
            <div className="d-flex align-items-end flex-column">
              <div className="message d-flex align-items-end flex-column">
                <div className="d-flex align-items-center mb-1 chat-msg">
                  <div className="flex-grow-1 ms-3">
                    <div className="msg-content card bg-primary">
                      <p className="mb-0 text-white">{transcriptItem.text}</p>
                      <TranscriptPlayStopButton
                        transcriptItem={transcriptItem}
                        playingSegment={playingSegment}
                        mediaPlayerShow={mediaPlayerShow}
                        onTimeClick={onTimeClick}
                        onStopAudio={onStopAudio}
                        variant="out"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Col>
      </Row>
    </div>
  );
}

export function CallAnalysisTranscript({
  chunksAnalysisData,
  uuid,
  mediaPlayerShow,
  audioLoading,
  audioError,
  setAudioError,
  audioPlayerRef,
  getAudioFilePath,
  loadAuthenticatedAudio,
  playingSegment,
  onTimeClick,
  onStopAudio,
}: Props) {
  const transcriptions = chunksAnalysisData?.transcriptions;
  const hasTranscriptions =
    Array.isArray(transcriptions) && transcriptions.length > 0;

  return (
    <Row>
      <Col md={12}>
        <div className="card">
          <div className="card-body">
            <div className="transcript">
              <Row>
                <Col md={12}>
                  <div className={`mb-4 mediaPlayerOuter ${mediaPlayerShow ? "show" : "d-none"}`}>
                    {renderMediaPlayerSection({
                      audioLoading,
                      audioError,
                      setAudioError,
                      loadAuthenticatedAudio,
                      mediaPlayerShow,
                      audioPlayerRef,
                      getAudioFilePath,
                      uuid,
                    })}
                  </div>
                </Col>
              </Row>

              {hasTranscriptions &&
                transcriptions.map((transcriptItem: Transcription, index: number) => (
                  <TranscriptLineItem
                    key={`${index}-${transcriptItem.start ?? "s"}-${transcriptItem.end ?? "e"}-${transcriptItem.speaker ?? "sp"}`}
                    transcriptItem={transcriptItem}
                    playingSegment={playingSegment}
                    mediaPlayerShow={mediaPlayerShow}
                    onTimeClick={onTimeClick}
                    onStopAudio={onStopAudio}
                  />
                ))}
            </div>
          </div>
        </div>
      </Col>
    </Row>
  );
}
