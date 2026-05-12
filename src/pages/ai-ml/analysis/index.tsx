import BreadcrumbItem from "@common/BreadcrumbItem";
import { useCallAnalysis } from "@hooks/aiml/useCallAnalysis";
import Layout from "@layout/index";
import "@assets/scss/datatable-style.scss";
import "@assets/scss/aiml.scss";
import "@assets/scss/chat.scss";
import "@assets/scss/audio-player.scss";
import "@assets/scss/tabs.scss";
import "@assets/scss/analysis-new.scss";
import React, { ReactElement } from "react";
import { Alert, Col, Row, Tab, Tabs } from "react-bootstrap";
import { CallAnalysisCustomerInfo } from "@page-modules/ai-ml/analysis/components/CallAnalysisCustomerInfo";
import { CallAnalysisEmotionsAndTopics } from "@page-modules/ai-ml/analysis/components/CallAnalysisEmotionsAndTopics";
import { CallAnalysisForm } from "@page-modules/ai-ml/analysis/components/CallAnalysisForm";
import { CallAnalysisProgressCard } from "@page-modules/ai-ml/analysis/components/CallAnalysisProgressCard";
import { CallAnalysisStatusBanner } from "@page-modules/ai-ml/analysis/components/CallAnalysisStatusBanner";
import { CallAnalysisSummaryCards } from "@page-modules/ai-ml/analysis/components/CallAnalysisSummaryCards";
import { CallAnalysisTranscript } from "@page-modules/ai-ml/analysis/components/CallAnalysisTranscript";
import { CallAnalysisTranslate } from "@page-modules/ai-ml/analysis/components/CallAnalysisTranslate";

const CallAnalysis = () => {
  const {
    chunksAnalysisData,
    loading,
    error,
    analysisComplete,
    validAnalysis,
    steps,
    currentStep,
    uuid,
    setUuid,
    date,
    setDate,
    localPartyNumber,
    setLocalPartyNumber,
    remotePartyNumber,
    ownerUsername,
    setOwnerUsername,
    imagicle,
    setImagicle,
    callType,
    callDurationFormatted,
    activeTab,
    setActiveTab,
    subActiveTab,
    setSubActiveTab,
    socketConnecting,
    audioPlayerRef,
    mediaPlayerShow,
    audioLoading,
    audioError,
    playingSegment,
    handleFormSubmit,
    resetAnalysisForm,
    handleTimeClick,
    handleStopAudio,
    getAudioFilePath,
    loadAuthenticatedAudio,
    setAudioError,
  } = useCallAnalysis();

  const analysis = chunksAnalysisData?.analysis;

  return (
    <React.Fragment>
      <BreadcrumbItem mainTitle="" mainLink="" subTitle="Call Analysis" />

      <Row className="mb-3">
        <Col md={12}>
          <div className="page-header-title">
            <Row className="align-items-center">
              <Col md={3}>
                <h2 className="mb-0 d-flex align-items-center">Call Analysis</h2>
              </Col>
              <Col md={9} className="text-end" />
            </Row>
          </div>
        </Col>
      </Row>

      <CallAnalysisForm
        uuid={uuid}
        setUuid={setUuid}
        date={date}
        setDate={setDate}
        localPartyNumber={localPartyNumber}
        setLocalPartyNumber={setLocalPartyNumber}
        ownerUsername={ownerUsername}
        setOwnerUsername={setOwnerUsername}
        imagicle={imagicle}
        setImagicle={setImagicle}
        loading={loading}
        socketConnecting={socketConnecting}
        onSubmit={handleFormSubmit}
        onReset={resetAnalysisForm}
      />

      {!error && (loading || steps.length > 0) && (
        <CallAnalysisProgressCard steps={steps} currentStep={currentStep} />
      )}

      {!error && steps.length > 0 && (
        <CallAnalysisStatusBanner steps={steps} currentStep={currentStep} />
      )}

      {error && (
        <Row className="mb-3">
          <Col md={12}>
            <Alert variant="danger">
              <Alert.Heading>Error</Alert.Heading>
              <p>{error}</p>
            </Alert>
          </Col>
        </Row>
      )}

      {!error && validAnalysis && analysisComplete && (
        <div className="analysis-container">
          <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k || "summary")} id="system-tabs" className="mb-3">
            <Tab eventKey="summary" title="Summary">
              {validAnalysis && (
                <>
                  <CallAnalysisCustomerInfo
                    analysis={analysis}
                    analysisComplete={analysisComplete}
                    callType={callType}
                    remotePartyNumber={remotePartyNumber}
                    callDurationFormatted={callDurationFormatted}
                  />
                  <CallAnalysisSummaryCards
                    chunksAnalysisData={chunksAnalysisData}
                    analysis={analysis}
                    analysisComplete={analysisComplete}
                  />
                  <CallAnalysisEmotionsAndTopics
                    chunksAnalysisData={chunksAnalysisData}
                    analysis={analysis}
                    analysisComplete={analysisComplete}
                  />
                </>
              )}
            </Tab>
            <Tab eventKey="transcript" title="Transcript">
              <CallAnalysisTranscript
                chunksAnalysisData={chunksAnalysisData}
                uuid={uuid}
                mediaPlayerShow={mediaPlayerShow}
                audioLoading={audioLoading}
                audioError={audioError}
                setAudioError={setAudioError}
                audioPlayerRef={audioPlayerRef}
                getAudioFilePath={getAudioFilePath}
                loadAuthenticatedAudio={loadAuthenticatedAudio}
                playingSegment={playingSegment}
                onTimeClick={handleTimeClick}
                onStopAudio={handleStopAudio}
              />
            </Tab>
            <Tab eventKey="translate" title="Translate">
              <CallAnalysisTranslate
                chunksAnalysisData={chunksAnalysisData}
                subActiveTab={subActiveTab}
                setSubActiveTab={setSubActiveTab}
              />
            </Tab>
          </Tabs>
        </div>
      )}
    </React.Fragment>
  );
};

CallAnalysis.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default CallAnalysis;
