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
  return (
    <Row>
      <Col md={12}>
        <div className="card">
          <div className="card-body">
            <div className="transcript">
              <Row>
                <Col md={12}>
                  <div className={`mb-4 mediaPlayerOuter ${mediaPlayerShow ? "show" : "d-none"}`}>
                    {audioLoading ? (
                      <div className="text-center p-4">
                        <Spinner animation="border" role="status">
                          <span className="visually-hidden">Loading audio...</span>
                        </Spinner>
                        <p className="mt-2">Loading audio file...</p>
                      </div>
                    ) : audioError ? (
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
                    ) : mediaPlayerShow ? (
                      <AudioPlayer
                        ref={audioPlayerRef}
                        audioSrc={getAudioFilePath()}
                        title={`Call Recording - ${uuid}`}
                        showWaveform={false}
                      />
                    ) : (
                      <Alert variant="info" className="text-center">
                        <Alert.Heading>No Audio Available</Alert.Heading>
                        <p>Audio file is not available for this call recording.</p>
                      </Alert>
                    )}
                  </div>
                </Col>
              </Row>

              {chunksAnalysisData?.transcriptions &&
                chunksAnalysisData.transcriptions.length > 0 &&
                chunksAnalysisData.transcriptions.map((transcriptItem: Transcription, index: number) => (
                  <div key={index}>
                    {chunksAnalysisData.transcriptions[index].speaker === TRANSCRIPTION_SPEAKER_1 ? (
                      <Row>
                        <Col md={6}>
                          <div className="message-in">
                            <div className="d-flex">
                              <div className="flex-shrink-0">
                                <div className="chat-avtar">
                                  <img
                                    className="rounded-circle img-fluid wid-40"
                                    src={avatar.src}
                                    alt="User image"
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
                                          {transcriptItem.start && transcriptItem.end && mediaPlayerShow && (
                                            <p className="text-primary mb-0">
                                              <span
                                                className="time-stamp cursor-pointer"
                                                onClick={() => {
                                                  const isCurrentlyPlaying =
                                                    playingSegment &&
                                                    playingSegment.start === transcriptItem.start &&
                                                    playingSegment.end === transcriptItem.end;
                                                  if (isCurrentlyPlaying) {
                                                    onStopAudio();
                                                  } else {
                                                    onTimeClick(transcriptItem.start, transcriptItem.end);
                                                  }
                                                }}
                                              >
                                                <i
                                                  className={`ti ${
                                                    playingSegment &&
                                                    playingSegment.start === transcriptItem.start &&
                                                    playingSegment.end === transcriptItem.end
                                                      ? "ti-player-pause"
                                                      : "ti-player-play"
                                                  }`}
                                                  title={
                                                    playingSegment &&
                                                    playingSegment.start === transcriptItem.start &&
                                                    playingSegment.end === transcriptItem.end
                                                      ? "Stop"
                                                      : "Listen"
                                                  }
                                                />
                                                {playingSegment &&
                                                playingSegment.start === transcriptItem.start &&
                                                playingSegment.end === transcriptItem.end
                                                  ? "Stop"
                                                  : "Listen"}
                                              </span>
                                            </p>
                                          )}
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
                                      {transcriptItem.start && transcriptItem.end && mediaPlayerShow && (
                                        <p className="text-white mb-0">
                                          <span
                                            className="time-stamp cursor-pointer time-stamp-padding"
                                            onClick={() => {
                                              const isCurrentlyPlaying =
                                                playingSegment &&
                                                playingSegment.start === transcriptItem.start &&
                                                playingSegment.end === transcriptItem.end;
                                              if (isCurrentlyPlaying) {
                                                onStopAudio();
                                              } else {
                                                onTimeClick(transcriptItem.start, transcriptItem.end);
                                              }
                                            }}
                                          >
                                            <i
                                              className={`ti ${
                                                playingSegment &&
                                                playingSegment.start === transcriptItem.start &&
                                                playingSegment.end === transcriptItem.end
                                                  ? "ti-player-pause"
                                                  : "ti-player-play"
                                              }`}
                                              title={
                                                playingSegment &&
                                                playingSegment.start === transcriptItem.start &&
                                                playingSegment.end === transcriptItem.end
                                                  ? "Stop"
                                                  : "Listen"
                                              }
                                            />
                                            {playingSegment &&
                                            playingSegment.start === transcriptItem.start &&
                                            playingSegment.end === transcriptItem.end
                                              ? "Stop"
                                              : "Listen"}
                                          </span>
                                        </p>
                                      )}
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
