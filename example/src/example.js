import React from 'react'
import ReactDOM from 'react-dom'
import HotMic from 'hot-mic'

class App extends React.Component {
  render () {
    return (
      <div>
        <HotMic/>
      </div>
    )
  }
}

ReactDOM.render(<App />, document.getElementById('app'));
