import React, { Component } from 'react';
import { connect } from 'react-redux';
import Router from 'next/router';

import Loader from '../shared/components/Loader';
import MapInfoBox from './components/MapInfoBox';

import { fetchLaneData } from '../statemanagement/MapStateManagement';

let Map;

class MapModal extends Component {

  static propTypes = {
    onDismiss: React.PropTypes.func,
    citySlug: React.PropTypes.string,
    activeVehicle: React.PropTypes.string,
    ownGuess: React.PropTypes.object,
    itemId: React.PropTypes.number,
    areaType: React.PropTypes.string,
    areaTypeFromExplore: React.PropTypes.string,
    renderingFromExplorePage: React.PropTypes.bool
  }

  constructor (props) {
    super(props);
    this.closeModal = this.closeModal.bind(this);
    this.onMapLoaded = this.onMapLoaded.bind(this);

    // Do not fetch is we are doing a server side rendering
    // (they are undefined and already fetched in getInitialProps)
    // MAYBE MOVE THAT TO EXPLORE PAGE and read state from redux store... ???
    if (this.props.renderingFromExplorePage && this.props.areaTypeFromExplore === 'lanes') {
      this.props.dispatch(fetchLaneData(this.props.itemId, this.props.areaTypeFromExplore));
    }

    this.state = { 
      showMap: false,
      mapLoaded: false
    };
  }

  componentDidMount() {
    // Do not render on server
    Map = require('./components/Map').default;
    this.setState({ 
      showMap: true 
    });
  }

  closeModal() {
    if (this.props.onDismiss) {
      this.props.onDismiss();
    } else {
      Router.push({
        pathname: '/explore',
        query: this.props.ownGuess.toJS()
      },{
        pathname: `/${this.props.citySlug}/explore/${this.props.activeVehicle}`,
        query: this.props.ownGuess.toJS()
      });
    }
  }

  onMapLoaded() {
    this.setState({
      mapLoaded: true
    });
  }

  render() {
    return (
      <div style={{ position: 'fixed', top:0, bottom:0, left:0, right:0, zIndex: 20000000}}>
        <MapInfoBox
          areaType={this.props.areaType}
          parkingData={this.props.parkingData}
          laneData={this.props.laneData}
          activeVehicle={this.props.activeVehicle}
          citySlug={this.props.citySlug}
          closeModal={this.closeModal}
        />
        {!this.state.mapLoaded &&
          <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', backgroundColor: '#e6e4e0' }}>
            <Loader />
          </div>
        }
        {this.state.showMap && this.props.areaType === 'parking' &&
          <Map
            areaType={this.props.areaType}
            parkingData={this.props.parkingData && this.props.parkingData.toJS()}
            onMapLoaded={this.onMapLoaded}
          />
        }
        {this.state.showMap && this.props.laneData && this.props.areaType === 'lanes' &&
          <Map
            areaType={this.props.areaType}
            laneData={this.props.laneData && this.props.laneData.toJS()}
            onMapLoaded={this.onMapLoaded}
          />
        }
      </div>
    );
  }
}

export default connect((state) => {
  return {
    citySlug: state.city.getIn(['actual_city','slug']),
    activeVehicle: state.vehicles.get('vehicle'),
    ownGuess: state.guess.get('own'),
    laneData: state.map.get('laneData'),
    parkingData: state.map.get('parkingData'),
    areaType: state.map.get('areaType')
  }
})(MapModal);
