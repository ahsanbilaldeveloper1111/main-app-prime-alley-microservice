import React, { useState, useRef, useEffect } from 'react';
import { Modal, Button, Spinner } from 'react-bootstrap';
import AudioPlayer, { AudioPlayerRef } from '@components/AudioPlayer';
import axiosInstance from '@utils/axios';
import { toast } from 'react-toastify';

interface CallRecordingPlayerModalProps {
  show: boolean;
  onHide: () => void;
  recording: any | null;
  onLoadingChange?: (loading: boolean) => void;
}

const CallRecordingPlayerModal: React.FC<CallRecordingPlayerModalProps> = ({
  show,
  onHide,
  recording,
  onLoadingChange,
}) => {
  const [audioLoading, setAudioLoading] = useState(false);
  const [audioError, setAudioError] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string>('');
  const audioPlayerRef = useRef<AudioPlayerRef>(null);

  const loadAuthenticatedAudio = async (
    audioTrackId: string,
    agentExtension: string,
    node?: string
  ) => {
    if (!audioTrackId) return;

    setAudioLoading(true);
    setAudioError(null);
    if (onLoadingChange) {
      onLoadingChange(true);
    }

    try {
      const response = await axiosInstance.get(
        `call-logs/recordings/download/${audioTrackId}`,
        {
          responseType: 'blob',
          params: {
            extension_number: agentExtension,
            node: node,
          },
          headers: {
            Accept: 'audio/*, application/octet-stream, */*',
          },
        }
      );

      if (onLoadingChange) {
        onLoadingChange(false);
      }

      if (response.status === 200) {
        const blob = new Blob([response.data], { type: 'audio/mpeg' });
        const url = window.URL.createObjectURL(blob);
        setAudioUrl(url);
      } else if (response.status === 204) {
        toast.error('Audio file not found');
        setAudioError('Audio file not found');
      } else {
        setAudioError(`Unexpected response status: ${response.status}`);
      }
    } catch (error: any) {
      if (onLoadingChange) {
        onLoadingChange(false);
      }

      if (error.response) {
        if (error.response.status === 204) {
          toast.error('Audio file not found');
          setAudioError('Audio file not found');
        } else {
          setAudioError(`Error loading audio: ${error.response.status}`);
        }
      } else if (error.request) {
        setAudioError('No response received from server');
      } else {
        setAudioError(`Request error: ${error.message}`);
      }
    } finally {
      setAudioLoading(false);
    }
  };

  useEffect(() => {
    if (show && recording) {
      const trackId = recording.Id;
      const agentExtension = recording.AgentExtension;
      loadAuthenticatedAudio(trackId, agentExtension, recording.imagicle);
    } else {
      // Clean up audio URL when modal closes
      if (audioUrl) {
        window.URL.revokeObjectURL(audioUrl);
        setAudioUrl('');
      }
      setAudioError(null);
    }
  }, [show, recording]);

  const handleClose = () => {
    // Stop audio playback
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
    }
    // Clean up audio URL
    if (audioUrl) {
      window.URL.revokeObjectURL(audioUrl);
      setAudioUrl('');
    }
    setAudioError(null);
    onHide();
  };

  return (
    <Modal show={show} onHide={handleClose} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>
          Playing a Call Recording
          {recording?.Id && ` - ${recording.Id}`}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {recording && (
          <div className="text-center d-flex flex-column align-items-center">
            {audioLoading ? (
              <div className="p-4">
                <Spinner animation="border" variant="primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </Spinner>
                <p className="mt-2">Loading audio file...</p>
              </div>
            ) : audioError ? (
              <div className="p-4">
                <div className="alert alert-warning">
                  <i className="ph-duotone ph-warning-circle me-2"></i>
                  {audioError}
                </div>
              </div>
            ) : (
              <div>
                <AudioPlayer
                  ref={audioPlayerRef}
                  audioSrc={audioUrl}
                  title={`Call Recording - ${recording.Id}`}
                  showWaveform={true}
                  autoPlay={true}
                />
              </div>
            )}
          </div>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={handleClose}>
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default CallRecordingPlayerModal;

