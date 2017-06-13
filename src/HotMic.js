import React, { Component } from 'react'
import PropTypes from 'prop-types';
import encodeWAV from './wav-encoder.js'


class HotMic extends React.Component {
  constructor(props) {
    super(props);
    this.buffers = [[], []];
    this.bufferLength = 0;
    this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    this.sampleRate = this.audioContext.sampleRate;
    this.recordingStream = null;
    this.playbackSource = null;
    this.audioFile = null;
    this.timer = null;
    this.percent = 0;
    this.state = { recording: false, playing: false, audio: props.audio };
  }

  startRecording() {
    navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;
    navigator.getUserMedia({ audio: true }, (stream) => {
      const gain = this.audioContext.createGain();
      const audioSource = this.audioContext.createMediaStreamSource(stream);
      audioSource.connect(gain);
      const bufferSize = 2048;
      const recorder = this.audioContext.createScriptProcessor(bufferSize, 2, 2);
      recorder.onaudioprocess = (event) => {
        for(let i = 0; i < 2; i++) { // save buffers in stereo
          const channel = event.inputBuffer.getChannelData(i);
          this.buffers[i].push(new Float32Array(channel));
        }
        this.bufferLength += bufferSize;
      };
      gain.connect(recorder);
      recorder.connect(this.audioContext.destination);
      this.recordingStream = stream;
    }, (err) => {
      console.log('error', err);
    });

    this.setState({ recording: true });
    if(this.props.onRecordStart) {
      this.props.onRecordStart.call();
    }
  }

  stopRecording() {
    this.recordingStream.getTracks()[0].stop();
    const audioData = encodeWAV(this.buffers, this.bufferLength, this.sampleRate);

    this.setState({ recording: false, audio: audioData, download: true });

    if(this.props.onChange) {
      this.props.onChange.call(null, {
        duration: this.bufferLength / this.sampleRate,
        blob: audioData
      });
    }

    this.audioFile = new Audio((window.URL || window.webkitURL).createObjectURL(audioData));

    this.audioFile.addEventListener("playing", (e) => {
      var duration = e.target.duration;
      advance(duration, this.audioFile);
    });

    this.audioFile.addEventListener("pause", (e) => {
      clearTimeout(this.timer);
    });

    this.audioFile.addEventListener("ended", (e) => {
      if(this.state.playing) {
        this.setState({ playing: false });
      }
      if(this.props.onEnded) {
        this.props.onEnded.call();
      }
      document.getElementById("progress").style.width = '0%'
    });

    var advance = (duration, el) => {
      this.percent = Math.min((10 / duration) * el.currentTime * 10, 100);
      document.getElementById("progress").style.width = this.percent + '%'
      console.log('percent = ' + this.percent + '%')
      startTimer(duration, el);
    }

    var startTimer = (duration, el) => {
      if(this.percent < 100) {
        this.timer = setTimeout(() => { advance(duration, el) }, 100);
      }
    }
  }

  startPlayback() {
    this.setState({ playing: true });
    if(this.props.onPlay) {
      this.props.onPlay.call();
    }
    this.audioFile.play()
  }

  stopPlayback(event) {
    if(this.state.playing) {
      event.preventDefault();
      this.setState({ playing: false });
      if(this.props.onAbort) {
        this.props.onAbort.call();
      }
    }
  }

  removeAudio() {
    if(this.state.audio) {
      console.log('this.state.audio', this.state.audio)
      if(this.playbackSource) {
        console.log('this.playbackSource', this.playbackSource)
        this.playbackSource.stop();
        delete this.playbackSource;
      }
      this.setState({ audio: null });
      if(this.props.onChange) {
        this.props.onChange.call();
      }
    }
  }

  componentWillReceiveProps(nextProps) {
    if(this.state.audio && nextProps.audio !== this.state.audio) {
      this.stopPlayback();
      this.setState({ audio: nextProps.audio });
    }
  }

  render() {
    const strings = this.props.strings;
    let buttonText;
    let buttonClass = ['HotMic-button']
    let recorderButtons;
    let clickHandler;

    if(this.state.audio) {
      buttonClass.push('hasAudio');
      if(this.state.playing) {
        buttonClass.push('isPlaying');
        buttonText = strings.playing;
        clickHandler = this.stopPlayback;
      } else {
        buttonText = strings.play;
        clickHandler = this.startPlayback;
      }
      recorderButtons = [
        <a key="download" className="HotMic-download" href={(window.URL || window.webkitURL).createObjectURL(this.state.audio)} download='recording.wav'>{strings.download}</a>,
        <button key="remove" className="HotMic-remove" onClick={this.removeAudio.bind(this)}>{strings.remove}</button>
      ];
    } else {
      if(this.state.recording) {
        buttonClass.push('isRecording');
        buttonText = strings.recording;
        clickHandler = this.stopRecording;
      } else {
        buttonText = strings.record;
        clickHandler = this.startRecording;
      }
    }

    return (
      <div className='HotMic'>
        <div className="player">
          <div className="progress" id="progress"></div>
        </div>
        <div className={"button " + (this.state.recording ? 'active ' : 'inactive ')} onClick={clickHandler && clickHandler.bind(this)}><div className="inner"></div></div>
        {recorderButtons}
        <button className={buttonClass.join(' ')} onClick={clickHandler && clickHandler.bind(this)}>
          <div className={(this.state.recording ? 'show' : 'hidden')}><span></span></div> {buttonText}
        </button>
      </div>
    );
  }
}

HotMic.propTypes = {
  audio: PropTypes.instanceOf(Blob),
  download: PropTypes.bool,
  loop: PropTypes.bool,
  onAbort: PropTypes.func,
  onChange: PropTypes.func,
  onEnded: PropTypes.func,
  onPause: PropTypes.func,
  onPlay: PropTypes.func,
  onRecordStart: PropTypes.func,

  strings: PropTypes.shape({
    play: PropTypes.string,
    playing: PropTypes.string,
    record: PropTypes.string,
    recording: PropTypes.string,
    remove: PropTypes.string,
    download: PropTypes.string
  })
};

HotMic.defaultProps = {
  loop: false,
  strings: {
    play: '🔊 Play',
    playing: '❚❚ Playing',
    record: '● Record',
    recording: ' Recording',
    remove: ' Record Again',
    download: 'Save' // unicode floppy disk
  }
};

export default HotMic;
