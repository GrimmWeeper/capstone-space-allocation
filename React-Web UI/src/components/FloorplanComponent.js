import React,{Component} from 'react';
import L, { marker } from 'leaflet';
import ReactDOM from 'react-dom';
import 'leaflet.sync';
import 'leaflet-easyprint';
import 'leaflet-path-transform';

class Floorplan extends Component {

    constructor(){
        super();
        this.state = {
            datalist :[]
        }
    }

    componentDidMount(){
        console.log("Component has mounted")

        var L1_map = this.L1_map = new L.map('L1_map').setView([1.34090,103.96315], 20)

        L.easyPrint({
            title: 'Export as PNG',
            position: 'bottomright',
            sizeModes: ['A4Landscape'],
            exportOnly: true,
            filename: 'Capstone-floorplan-L1'
        }).addTo(L1_map);


        // generate random color
        function getColor(){
            var color = '#';
            var letter = '0123456789ABCDEF';
            for (var i =0; i < 6;i++){
                color += letter[Math.floor(Math.random()*16)];
            }
            return color;
        }
        
        //create tilelayer for the map
        L.tileLayer('https://api.mapbox.com/styles/v1/pluying/ck99ze9ud0tcz1ipdtata0kkz/tiles/256/{z}/{x}/{y}@2x?access_token=pk.eyJ1IjoicGx1eWluZyIsImEiOiJjazgycHJ2aWEwb3VkM2VxcTE1dmJ4cHJsIn0.4TzOMB_v_aekafcxXa9-tg',{
            minZoom:0,
            maxZoom:22,
            noWrap: true,
            continuousWorld:false,
        }).addTo(L1_map);

        fetch('http://localhost:3001/getLevel1')
        .then(function(response){
            response.json()
            .then(function(data){
                L.geoJSON(JSON.parse(data[0].st_asgeojson))
                    .addTo(L1_map)
            })                
        })

        fetch('http://localhost:3001/getLevel2')
        .then(function(response){
            response.json()
            .then(function(data){
                L.geoJSON(JSON.parse(data[0].st_asgeojson))
                    .addTo(L2_map)
            })                
        })
        //fetch project data and display

        fetch('http://localhost:3001/getSquaresL1')
        .then(function(response){
            response.json()
            .then(function(data) {
                for (let i = 0; i < data.length; i++){
                    var polydetail = "<b>" + data[i].project_no + " " + data[i].project_name + "</b>"
                            + "<br>" + "With " +  data[i].company
                            + "<br>" + data[i].length + " by " + data[i].width + " by " + data[i].height
                            + "<br>" + "PowerPoints needed: " + data[i].number_of_power_points_needed
                    var geojson = JSON.parse(data[i].st_asgeojson)
    
                    var coors = geojson.coordinates[0]; //transform to LatLng
                    var latlng = [];
                    for (var j=0; j<coors.length;j++){
                        var temp = [coors[j][1],coors[j][0]]
                        latlng.push(temp);
                    }

                    var polygon = L.polygon(latlng,{
                        draggable: 'true',
                        transform: 'true',
                        color: getColor(),
                    })
                    .bindPopup(polydetail)
                    .bindTooltip(data[i].project_no, { draggable:true, direction:"center"})
                    .addTo(L1_map);

                    polygon.transform.enable({rotation: true, scaling: false})
                }
            })
        })

        var L2_map = this.L2_map = new L.map('L2_map').setView([1.34090,103.96315], 20)

        L.tileLayer('https://api.mapbox.com/styles/v1/pluying/ck99ziy5h0tkt1iqjib8mjkyp/tiles/256/{z}/{x}/{y}@2x?access_token=pk.eyJ1IjoicGx1eWluZyIsImEiOiJjazgycHJ2aWEwb3VkM2VxcTE1dmJ4cHJsIn0.4TzOMB_v_aekafcxXa9-tg',{
            minZoom:0,
            maxZoom:22,
            noWrap: true,
            continuousWorld:false,
        }).addTo(L2_map);

        

        fetch('http://localhost:3001/getSquaresL2')
        .then(function(response){
            response.json()
            .then(function(data) {
                for (let i = 0; i < data.length; i++){
                    var polydetail = "<b>" + data[i].project_no + " " + data[i].project_name + "</b>"
                            + "<br>" + "With " +  data[i].company
                            + "<br>" + data[i].length + " by " + data[i].width + " by " + data[i].height
                            + "<br>" + "PowerPoints needed: " + data[i].number_of_power_points_needed
                    var geojson = JSON.parse(data[i].st_asgeojson)
    
                    var coors = geojson.coordinates[0]; //transform to LatLng
                    var latlng = [];
                    for (var j=0; j<coors.length;j++){
                        var temp = [coors[j][1],coors[j][0]]
                        latlng.push(temp);
                    }

                    var polygon = L.polygon(latlng,{
                        draggable: 'true',
                        transform: 'true',
                        color: getColor(),
                    })
                    .bindPopup(polydetail)
                    .bindTooltip(data[i].project_no, { draggable:true, direction:"center"})
                    .addTo(L2_map);

                    polygon.transform.enable({rotation: true, scaling: false})
                }
            })
        })

        L.easyPrint({
            title: 'Export as PNG',
            position: 'bottomright',
            sizeModes: ['A4Landscape'],
            exportOnly: true,
            filename: 'Capstone-floorplan-L2'
        }).addTo(L2_map);

        L1_map.sync(L2_map);
        L2_map.sync(L1_map);


    }


    render(){
        return (
            <div className = "map">
                <div id = "L1_map"></div>
                <div id = "L2_map"></div>
            </div>
            
        )
    }

}

    
 export default Floorplan;