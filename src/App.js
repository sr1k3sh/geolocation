import logo from './school.png';
import './App.css';
import 'mapbox-gl/dist/mapbox-gl.css';
import React, { useRef, useEffect, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import {schools} from './geoJson';

mapboxgl.accessToken = 'pk.eyJ1IjoicjFrM3NoIiwiYSI6ImNrdGp5Nmx5cDFnczAzMnJ0OHMwaDEwbWkifQ.E2jcYVFQPA6IJ9xLQ4A7sw';

function App() {

  const mapContainer = useRef(null);
  const map = useRef(null);

  const [data, setData] = useState([]);

  function flyToStore(currentFeature) {
    map.current.flyTo({
      center: currentFeature.geometry.coordinates[0][0],
      zoom: 15
    });
  }

  function createPopUp(currentFeature) {
    new mapboxgl.Popup()
      .setLngLat(currentFeature.geometry.coordinates[0][0])
      .setHTML(currentFeature.properties.name?currentFeature.properties.name:'no name')
      .addTo(map.current);
  }

  useEffect(() => {

    setData(schools.features);

    if (map.current) return; // initialize map only once
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v11',
      center: [85.3322829, 27.7379197],
      zoom: 9
    });


    map.current.addControl(
      new mapboxgl.GeolocateControl({
      positionOptions: {
      enableHighAccuracy: true
      },
      // When active the map will receive updates to the device's location as it changes.
      trackUserLocation: true,
      // Draw an arrow next to the location dot to indicate which direction the device is heading.
      showUserHeading: true
      })
    );

    map.current.on('load', () => {

      map.current.loadImage(
        logo,
        (error, image) => {
        if (error) throw error;
        map.current.addImage('custom-marker', image);

        // buildLocationList(schools.features);

        map.current.addSource('places', {
            // This GeoJSON contains features that include an "icon"
            // property. The value of the "icon" property corresponds
            // to an image in the Mapbox Streets style's sprite.
            'type': 'geojson',
            'data': schools
        });
        // Add a layer showing the places.
        map.current.addLayer({
            'id': 'places',
            'type': 'symbol',
            'source': 'places',
            'layout': {
                'icon-image': "custom-marker",
                'icon-allow-overlap': true
            }
        });
  
        map.current.addLayer({
          'id': 'places1',
          'type': 'line',
          'source': 'places',
          'layout': {},
          'paint': {
            'line-color': '#000',
            'line-width': 1
          }
        });

        map.current.addLayer({
          'id': 'off-leash-areas',
          'type': 'symbol',
          'source': 'places',
          'layout': {
            'text-field': [
              'format',
                ['upcase', ['get', 'name']],
                { 'font-scale': 0.8 },
                '\n',
                {},
            ],
            'text-size': 11,
            'text-transform': 'uppercase',
            'text-letter-spacing': 0.05,
            'text-offset': [0, 3],
            'text-font': ['Open Sans Semibold', 'Arial Unicode MS Bold']
            },
            'paint': {
              'text-color': '#202',
              'text-halo-color': '#fff',
              'text-halo-width': 2
            },
        });
  
        // When a click event occurs on a feature in the places layer, open a popup at the
        // location of the feature, with description HTML from its properties.
        map.current.on('click', 'places', (e) => {
            // Copy coordinates array.
            const coordinates = e.features[0].geometry.coordinates[0][0];
            const description = e.features[0].properties.name;
  
            // Ensure that if the map is zoomed out such that multiple
            // copies of the feature are visible, the popup appears
            // over the copy being pointed to.
            while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
                coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
            }

            new mapboxgl.Popup()
              .setLngLat(coordinates)
              .setHTML(description?description:'no name')
              .addTo(map.current);
    
        });
  
        // Change the cursor to a pointer when the mouse is over the places layer.
        map.current.on('mouseenter', 'places', () => {
            map.current.getCanvas().style.cursor = 'pointer';
        });
  
        // Change it back to a pointer when it leaves.
        map.current.on('mouseleave', 'places', () => {
            map.current.getCanvas().style.cursor = '';
        });

      });
    });
    
    return()=>{
      setData([]);
    }
  },[]);

  const onClickList = function(e){
    e.preventDefault();
    for (const feature of data) {
      if (e.currentTarget.id === `listing-${feature.id}`) {
        flyToStore(feature);
        createPopUp(feature);
      }
    }
    const activeItem = document.getElementsByClassName('active');
    if (activeItem[0]) {
      activeItem[0].classList.remove('active');
    }
    e.currentTarget.parentNode.classList.add('active');
  }
  
  const onChangeRadio = (e) =>{

    let tempdata = []
    let tempSchool = {};

    switch (e.target.value) {
      case 'all':
        tempdata = schools.features;
        break;

      case 'primary':
        tempdata = schools.features.filter(d=>d.properties["isced:level"]==="primary");
      break;

      case 'secondary':
        tempdata = schools.features.filter(d=>d.properties["isced:level"]==="secondary");
      break;

      case 'lower_secondary':
        tempdata = schools.features.filter(d=>d.properties["isced:level"]==="lower_secondary");
        break;

      case "higher_secondary":
        tempdata = schools.features.filter(d=>d.properties["isced:level"]==="higher_secondary");
        break;

      case 'college':
        tempdata = schools.features.filter(d=>d.properties["isced:level"]==="college");
      break;

      default:
        tempdata = schools.features;
        break;
    }

    tempSchool.type = "FeatureCollection";

    tempSchool.features = tempdata;

    setData(tempSchool.features);
    map.current?.getSource('places').setData(tempSchool);
  }

  return (
    <div className="App">
      <div>
        <div className='radio-container'>
          <div className='radio-wrapper'>
            <input type='radio' id="radio_all" onChange={onChangeRadio} name="radio" value="all" defaultChecked></input>
            <label htmlFor="radio_all">all</label>
          </div>
          <div className='radio-wrapper'>
            <input type='radio' id="radio_primary" onChange={onChangeRadio} name="radio" value="primary"></input>
            <label htmlFor="radio_primary">primary</label>
          </div>
          <div className='radio-wrapper'>
            <input type='radio' id="radio_lower" name="radio" onChange={onChangeRadio} value="lower_secondary" ></input>
            <label htmlFor="radio_lower">lower_secondary</label>
          </div>
          <div className='radio-wrapper'>
            <input type='radio' id="radio_secondary" name="radio" onChange={onChangeRadio} value="secondary" ></input>
            <label htmlFor="radio_secondary">secondary</label>
          </div>
          <div className='radio-wrapper'>
            <input type='radio' id="radio_higher" name="radio" onChange={onChangeRadio} value="higher_secondary" ></input>
            <label htmlFor="radio_higher">higher_secondary</label>
          </div>
          <div className='radio-wrapper'>
            <input type='radio' id="radio_college" onChange={onChangeRadio} name="radio" value="college"></input>
            <label htmlFor="radio_college">college</label>
          </div>
        </div>

        <span className='float-count'>Numbers of results: {data.length}</span>
        <ul id="listings" className="listings">
          {
            data.length && data.map((d,i)=><React.Fragment>
              <li key={"test"+i} id={"listing-"+d.id} className='item' onClick={e=>onClickList(e)}>
                <span key={"title"+i} className='title' id={"link-"+d.id}>{d.properties.name}</span>
                <span key={"sub-title"+i} className='sub-title'>{d.properties.phone?d.properties.phone:'no number'}</span>
              </li>
            </React.Fragment>)
          }
        </ul>
        <div ref={mapContainer} className="map-container"></div>
        </div>
    </div>
  );
}

export default App;
