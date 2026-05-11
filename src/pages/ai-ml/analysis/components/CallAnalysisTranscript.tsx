import AudioPlayer, { AudioPlayerRef } from "@components/AudioPlayer";
import avatar from "@assets/images/user/avatar-3.jpg";
import { TRANSCRIPTION_SPEAKER_1 } from "@pages/ai-ml/analysis/constants";
import type { Transcription } from "@pages/ai-ml/analysis/types";
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

function isSegmentPlaying(
  playingSegment: { start: number; end: number } | null,
  start: number,
  end: number,
): boolean {
  return playingSegment?.start === start && playingSegment?.end === end;
}

function transcriptItemKey(item: Transcription): string {
  return `${item.speaker}-${item.start}-${item.end}`;
}

function canShowTranscriptAudioControls(item: Transcription, mediaPlayerShow: boolean): boolean {
  return item.start != null && item.end != null && mediaPlayerShow;
}

type TranscriptTimestampControlProps = Readonly<{
  transcriptItem: Transcription;
  playingSegment: { start: number; end: number } | null;
  mediaPlayerShow: boolean;
  onTimeClick: (start: number, end: number) => void;
  onStopAudio: () => void;
  paragraphClassName: string;
  buttonClassName: string;
  buttonTextClass?: string;
}>;

function TranscriptTimestampControl({
  transcriptItem,
  playingSegment,
  mediaPlayerShow,
  onTimeClick,
  onStopAudio,
  paragraphClassName,
  buttonClassName,
  buttonTextClass,
}: TranscriptTimestampControlProps) {
  if (!canShowTranscriptAudioControls(transcriptItem, mediaPlayerShow)) {
    return null;
  }

  const { start, end } = transcriptItem;
  const playing = isSegmentPlaying(playingSegment, start, end);
  const label = playing ? "Stop" : "Listen";
  const iconClass = playing ? "ti-player-pause" : "ti-player-play";

  return (
    <p className={paragraphClassName}>
      <button
        type="button"
        className={`${buttonClassName} border-0 bg-transparent p-0 text-start ${buttonTextClass ?? ""}`}
        onClick={() => {
          if (playing) {
            onStopAudio();
          } else {
            onTimeClick(start, end);
          }
        }}
      >
        <i className={`ti ${iconClass}`} title={label} aria-hidden />
        {label}
      </button>
    </p>
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
  let mediaPlayerPanel: React.ReactNode;
  if (audioLoading) {
    mediaPlayerPanel = (
      <div className="text-center p-4">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading audio...</span>
        </Spinner>
        <p className="mt-2">Loading audio file...</p>
      </div>
    );
  } else if (audioError) {
    mediaPlayerPanel = (
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
  } else if (mediaPlayerShow) {
    mediaPlayerPanel = (
      <AudioPlayer
        ref={audioPlayerRef}
        audioSrc={getAudioFilePath()}
        title={`Call Recording - ${uuid}`}
        showWaveform={false}
      />
    );
  } else {
    mediaPlayerPanel = (
      <Alert variant="info" className="text-center">
        <Alert.Heading>No Audio Available</Alert.Heading>
        <p>Audio file is not available for this call recording.</p>
      </Alert>
    );
  }

  const transcriptions = chunksAnalysisData?.transcriptions;

  return (
    <Row>
      <Col md={12}>
        <div className="card">
          <div className="card-body">
            <div className="transcript">
              <Row>
                <Col md={12}>
                  <div className={`mb-4 mediaPlayerOuter ${mediaPlayerShow ? "show" : "d-none"}`}>
                    {mediaPlayerPanel}
                  </div>
                </Col>
              </Row>

              {transcriptions &&
                transcriptions.length > 0 &&
                transcriptions.map((transcriptItem: Transcription) => (
                  <div key={transcriptItemKey(transcriptItem)}>
                    {transcriptItem.speaker === TRANSCRIPTION_SPEAKER_1 ? (
                      <Row>
                        <Col md={6}>
                          <div className="message-in">
                            <div className="d-flex">
                              <div className="flex-shrink-0">
                                <div className="chat-avtar">
                                  <img
                                    className="rounded-circle img-fluid wid-40"
                                    src={avatar.src}
                                    alt=""
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
                                          <TranscriptTimestampControl
                                            transcriptItem={transcriptItem}
                                            playingSegment={playingSegment}
                                            mediaPlayerShow={mediaPlayerShow}
                                            onTimeClick={onTimeClick}
                                            onStopAudio={onStopAudio}
                                            paragraphClassName="text-primary mb-0"
                                            buttonClassName="time-stamp cursor-pointer"
                                            buttonTextClass="text-primary"
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
                    ) : (
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
                                      <TranscriptTimestampControl
                                        transcriptItem={transcriptItem}
                                        playingSegment={playingSegment}
                                        mediaPlayerShow={mediaPlayerShow}
                                        onTimeClick={onTimeClick}
                                        onStopAudio={onStopAudio}
                                        paragraphClassName="text-white mb-0"
                                        buttonClassName="time-stamp cursor-pointer time-stamp-padding"
                                        buttonTextClass="text-white"
                                      />
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </Col>
                      </Row>
                    )}
                  </div>
                ))}
            </div>
          </div>
        </div>
      </Col>
    </Row>
  );
}
