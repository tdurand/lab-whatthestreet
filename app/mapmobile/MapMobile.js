import React, { Component } from "react";
import { connect } from 'react-redux';
import TWEEN from 'tween.js';
import { bbox } from '@turf/turf';
import rotate from '@turf/transform-rotate';
import Config from '../../config.json';
import * as d3geo from 'd3-geo';

import { unfold } from '../shared/utils/unfold';
import {
  calculateBendWay,
  getLongestTranslation,
  getZoomLevel
} from '../shared/utils/geoutils';
import * as identifiers from '../statemanagement/constants/identifiersConstants';

const containerStyle = {
  display: "flex",
  height: "512px",
  width: "512px"
};

const unfolder = unfold();

let ReactMapboxGl;


class Map extends Component {

  static propTypes = {
    activeVehicle: React.PropTypes.string,
    areaType: React.PropTypes.string,
    laneData: React.PropTypes.object,
    parkingData: React.PropTypes.object
  }

  constructor(props) {
    super(props);

    this.onMapLoaded = this.onMapLoaded.bind(this);
    this.zoomIn = this.zoomIn.bind(this);
    this.zoomOut = this.zoomOut.bind(this);
    this.toggleLayer = this.toggleLayer.bind(this);
    this.lastComputedId = 0;
    this.computingGeojson = false;
    this.renderingOnCanvas = false;
    this.geojson = {
      "type": "FeatureCollection",
      "properties": {
        "name": "data"
      },
      "features": []
    };

    this.emptyGeoJson = this.geojson;

    this.state = {
      activeLayer: identifiers.satelliteLayer,
      showMap: false
    }
  }

  componentWillReceiveProps(newProps) {
    // if (newProps.isVisible === true) {
    //   if (newProps.areaType === 'lanes' &&
    //       newProps.laneData !== null) {
    //     this.renderData(newProps);
    //   }
    //   if (newProps.areaType === 'parking' &&
    //       newProps.activeVehicle !== 'rail' &&
    //       newProps.parkingData !== null) {
    //     this.renderData(newProps);
    //   }
    //   if (newProps.areaType === 'parking' &&
    //       newProps.activeVehicle === 'rail' &&
    //       newProps.laneData !== null) {
    //     this.renderData(newProps);
    //   }
    // } else {
    //   // If we have closed it, stop animating
    //   this.animating = false;
    //   TWEEN.removeAll();
    // }
  }

  componentDidMount() {
    // Do not render on server
    require('mapbox.js').default;
    this.setState({ 
      showMap: true 
    });
    L.mapbox.accessToken = Config.mapboxToken;
    this.map = L.mapbox.map('map', null, { zoomControl:false });
    this.styleLayer = L.mapbox.styleLayer("mapbox://styles/moovellab/cj3puddkq00002skevihhyt07").addTo(this.map);
    this.map.setView([40, -74.50], 9);
    this.onMapLoaded();
    // Expose renderAnimation function for phantomjs
    window.renderAnimation =  this.renderAnimation.bind(this);
  }

  initCanvas() {
    const self = this;
    this.transform = d3geo.geoTransform({
      point: function(lon, lat) {
        const pointOnCanvas = self.map.project(L.latLng(lat, lon));
        this.stream.point(pointOnCanvas.x, pointOnCanvas.y);
      }
    });
    this.context = this.d3canvas.getContext("2d");
    this.d3canvas.width = 512;
    this.d3canvas.height = 512;
    this.path = d3geo.geoPath().context(this.context).projection(this.transform);
  }

  clearCanvas() {
    this.d3canvas.getContext("2d").clearRect(0, 0, this.d3canvas.width, this.d3canvas.height);
  }

  renderOnCanvas(geojson) {
    this.renderingOnCanvas = true;
    const context = this.d3canvas.getContext("2d");
    context.clearRect(0, 0, this.d3canvas.width, this.d3canvas.height);
    context.beginPath();
    this.path(geojson);
    context.lineWidth = 5;
    context.strokeStyle = '#FF6819';
    context.lineCap = 'round';
    context.stroke();
    this.renderingOnCanvas = false;
  }

  onMapLoaded() {
    this.addBaseLayer();
    this.initCanvas();
    this.prepareAnimation(this.props);
    // console.log('MapLoaded');
  }

  addBaseLayer() {
    // Init geojson layer
    this.streetDataLayer = L.geoJSON();
    this.streetDataLayer.addTo(this.map);
    this.setDataToLayer(this.geojson);
  }

  zoomIn() {
    if(this.map) {
      this.map.zoomTo(this.map.getZoom() + 0.5);
    }
  }

  zoomOut() {
    if(this.map) {
      this.map.zoomTo(this.map.getZoom() - 0.5);
    }
  }

  toggleLayer() {
    if(this.animating) {
      return;
    }
    if(this.state.activeLayer === identifiers.satelliteLayer) {
      const streetLayer = identifiers.streetLayer;
      this.setState({
        activeLayer: streetLayer
      });
      this.map.setStyle(`mapbox://styles/${streetLayer}`, true);
    } else {
      const satelliteLayer = identifiers.satelliteLayer
      this.setState({
        activeLayer: satelliteLayer
      });
      this.map.setStyle(`mapbox://styles/${satelliteLayer}`, true);
    }
  }

  animate(startingAnimation) {
    if(startingAnimation) {
      this.animating = true;
    }
    return window.requestAnimationFrame(() => {
      TWEEN.update();
      if(this.animating) {
        this.animate();
      }
    });
  }

  /*
    RENDER STREET UTILITIES
   */

  unfold(laneData, progressUnfold, progressStitch) {
    return unfolder.geoJsonStreetAnimation(
      laneData.original,
      laneData.coiled,
      laneData.properties.origin,
      progressUnfold,
      progressStitch
    );
  }

  setDataToLayer(newData) {
    this.streetDataLayer.clearLayers(); 
    this.streetDataLayer.addData(newData);
    this.streetDataLayer.setStyle({
        "lineCap": "round",
        "lineJoin": "round",
        "color": "#FF6819",
        "weight": 5
    });
  }

  getBoundsFromBBox(bbox) {
    var p1 = L.latLng(bbox[1], bbox[0]);
    var p2 = L.latLng(bbox[3], bbox[2]);
    var bounds = L.latLngBounds(p1, p2);
    return bounds;
  }

  prepareAnimation(props) {
    // Zoom in and zoom out to both location to preload tiles
    // Center map on coiler line coord
    let center = [
      props.laneData.properties.origin.lat,
      props.laneData.properties.origin.lon
    ]
    // Get max zoom lvl
    const meterPerPixel = 1.2672955975;
    const initZoom = getZoomLevel(props.laneData.properties.origin.lat, meterPerPixel);

    // Init map at the position of the street
    this.map.setView(center,initZoom);

    // Compute bbox start and bbox end
    const geoJsonFolded = this.unfold(props.laneData, 0, 0);
    const geoJsonUnfolded = this.unfold(props.laneData, 1, 1);

    const bboxFolded = bbox(geoJsonFolded);
    const bboxUnfolded = bbox(geoJsonUnfolded);

    // Fit bounds to the street folded
    this.map.fitBounds(this.getBoundsFromBBox(bboxUnfolded), {
      animate: false,
      maxZoom: 18,
      padding: [50, 50]
    });

    this.styleLayer.once('load', () => {
      console.log('tiles bboxUnfolded Loaded')
      //Go to the folded once we have loaded the unfolded tiles 
      this.map.flyToBounds(this.getBoundsFromBBox(bboxFolded), {
        maxZoom: 18,
        padding: [20, 20],
        animate: true,
        duration: 0.5
      });

      this.styleLayer.once('load', () => {
        console.log('tiles bboxFolded Loaded');
        console.log('notify we are phantom ready to animate');
        if (typeof window.callPhantom === "function") {
          // Get timings of the animation to communicate them to phantomjs:
          let timeUnfold = calculateBendWay(props.laneData.original.vectors) * 200000;
          timeUnfold = timeUnfold > 5000 ? 5000 : timeUnfold;
          timeUnfold = timeUnfold < 1300 ? 1300 : timeUnfold;

          let timeUnstitch = (getLongestTranslation(props.laneData.original.vectors) * 200000 - 199) * 9090 - 7000
          timeUnstitch = timeUnstitch > 2000 ? 2000 : timeUnstitch;
          timeUnstitch = timeUnstitch < 1000 ? 1000 : timeUnstitch;
          let unstitchDelay = 600;
          let unfoldDelay = 2000;

          window.callPhantom({
            type: "readyToAnimate",
            animationDuration: timeUnfold + unfoldDelay + timeUnstitch + unstitchDelay
          });
        } else {
          // We are in normal browser, renderAnimation
          window.renderAnimation();
        }
        
      });
      
    });
  }


  renderAnimation() {
    const self = this;
    const props = this.props;
    if(this.map) {
      // Center map on coiler line coord
      let center = [
        props.laneData.properties.origin.lat,
        props.laneData.properties.origin.lon
      ]
      // Get max zoom lvl
      const meterPerPixel = 1.2672955975;
      const initZoom = getZoomLevel(props.laneData.properties.origin.lat, meterPerPixel);

      // Compute bbox start and bbox end
      const geoJsonFolded = this.unfold(props.laneData, 0, 0);
      const geoJsonUnfolded = this.unfold(props.laneData, 1, 1);

      const bboxFolded = bbox(geoJsonFolded);
      const bboxUnfolded = bbox(geoJsonUnfolded);

      this.styleLayer.on('load', () => {
        this.styleLayer.off('load');
        console.log('all visible tile loaded');
      })
        // maxZoom: 18,
        // padding: 100,
        // linear: true,
        // duration: 0

      // Wait 1s and fit to the unfolded BBOX before starting the animation
      // Set to a fixed 1s linear because we need to know how long it takes
      // to delay start of animation by the same amount
      // In this case, 1s + 1s = 2s
      // We can't move the camera during the animation, otherwise FPS drops dramaticly
      setTimeout(() => {
        // Fit bounds to the street folded
        this.map.flyToBounds(this.getBoundsFromBBox(bboxUnfolded), {
          maxZoom: 18,
          padding: [20, 20],
          animate: true,
          duration: 0.5
        });
      }, 1000)

      // This depends on how much movement is in the street geometry
      // NOTE @tdurand: I didn't investivate how calculateBendWay is computed and why
      // we multiply by magic number 200000
      // constrain it between 1.3s and 5s
      let timeUnfold = calculateBendWay(props.laneData.original.vectors) * 200000;
      timeUnfold = timeUnfold > 5000 ? 5000 : timeUnfold;
      timeUnfold = timeUnfold < 1300 ? 1300 : timeUnfold;
      // This depends on how long the biggest translation is (when a street consists of multiple segments)
      // NOTE @tdurand: I didn't investivate how getLongestTranslation is computed and why
      // NOTE @mszell: I tested this a bit and found the right limits. Before it always capped at 1s, now it is 2s for long translations which looks better.
      // we multiply by magic number 200000
      // constrain it between 1s and 2s
      let timeUnstitch = (getLongestTranslation(props.laneData.original.vectors) * 200000 - 199) * 9090 - 7000
      timeUnstitch = timeUnstitch > 2000 ? 2000 : timeUnstitch;
      timeUnstitch = timeUnstitch < 1000 ? 1000 : timeUnstitch;
      let unstitchDelay = 600;
      // Way 2s delay of camera zooming out from folded bbox to unfolded bbox
      // + 1s to make sure tile are loaded
      let unfoldDelay = 2000;

      // Draw the first frame
      this.setDataToLayer(geoJsonFolded);
      // this.map.setLayoutProperty('data', 'visibility', 'visible');
      // Clear previous canvas if any
      this.clearCanvas();

      const unfoldTween = new TWEEN.Tween({progress: 0})
                                  .to({ progress: 1 }, timeUnfold)
                                  .easing(TWEEN.Easing.Quadratic.Out)
                                  .delay(unfoldDelay);
      const stitchTween = new TWEEN.Tween({progress: 0})
                                  .to({ progress: 1 }, timeUnstitch)
                                  .easing(TWEEN.Easing.Cubic.Out)
                                  .delay(unstitchDelay);
      unfoldTween.chain(stitchTween);
      unfoldTween.onStart(() => {
        //Clear geojson of mapbox to render on the overlaying canvas
        // this.renderOnCanvas(this.geoJsonFolded);
        this.setDataToLayer(this.emptyGeoJson);
        // this.map.setLayoutProperty('data', 'visibility', 'none');
      });
      unfoldTween.onUpdate((progressUnfold) => {
        // WARNING onUpdate is called at 60 FPS or more, what goes here should be super optimized
        // calling map.setData is the most expensive task, followed by calling unfold
        // we make sure we do not queue setData updates and do not overload
        // the mapbox gl buffer, otherwise FPS drop drasticly
        // We do that by making sure previous setData has been loaded and
        // that we are not in the middle of a unfold computation
        if(this.renderingOnCanvas === false &&
          this.computingGeojson === false) {

          this.computingGeojson = true;
          const geojson = this.unfold(props.laneData, progressUnfold, 0);
          this.setDataToLayer(geojson);
          // this.renderOnCanvas(geojson);
          this.computingGeojson = false;
        } else {
          // Skip frame, we were not ready to handle it
        }
      });
      stitchTween.onUpdate((progressStitch) => {
        // WARNING onUpdate is called at 60 FPS or more, what goes here should be super optimized
        // calling map.setData is the most expensive task, followed by calling unfold
        // we make sure we do not queue setData updates and do not overload
        // the mapbox gl buffer, otherwise FPS drop drasticly
        // We do that by making sure previous setData has been loaded and
        // that we are not in the middle of a unfold computation
        if(this.renderingOnCanvas === false &&
          this.computingGeojson === false) {
          this.computingGeojson = true;
          const geojson = this.unfold(props.laneData, 1, progressStitch);
          this.setDataToLayer(geojson);
          // this.renderOnCanvas(geojson);
          this.computingGeojson = false;
        } else {
          // Skip drame, we were not ready to handle it
        }
      });
      stitchTween.onComplete(() => {
        this.animating = false;
        // Register geojson final in case we stich layers
        this.geojson = geoJsonUnfolded;
        // Clear canvas and render geojson on the mapbox canvas
        // this.setDataToLayer(this.geojson);
        // this.map.getSource('data').setData(this.geojson);
        // this.map.setLayoutProperty('data', 'visibility', 'visible');
        // setTimeout(() => {
        //   this.clearCanvas();
        // }, 200);
        // Clean listener because it can trigger onComplete afterwise if not
        TWEEN.removeAll();
      })

      // NOTE: maybe a room for improvement would be to make sure tiles
      // of viewport are loaded before starting to animate
      unfoldTween.start();
      this.animate(true);
    }
  }

  renderData(props) {
    if(!props.laneData) {
      return;
    }
    this.renderLane(props);
    this.lastComputedId = props.laneData._id;
  }

  render() {
    return (
      <div>
        <div>
          <div id="map"></div>
          <canvas ref={(el) => this.d3canvas = el} className="d3"></canvas>
        </div>
        <style jsx>{`
          #map {
            width: 512px;
            height: 512px;
          }
          .d3 {
            position: absolute;
            top: 0;
            bottom: 0;
            right: 0;
            left: 0;
            z-index: 1000;
            pointer-events: none;
          }
        `}</style>
      </div>
    );
  }
}

export default connect((state) => {
  return {
    citySlug: state.city.getIn(['actual_city','slug']),
    cityName: state.city.getIn(['actual_city','name']),
    activeVehicle: state.vehicles.get('vehicle'),
    ownGuess: state.guess.get('own'),
    laneData: state.map.get('laneData') && state.map.get('laneData').toJS(),
    parkingData: state.map.get('parkingData') && state.map.get('parkingData').toJS(),
    areaType: state.map.get('areaType'),
    isFetchingLaneData: state.map.get('isFetchingLaneData')
  }
})(Map);
