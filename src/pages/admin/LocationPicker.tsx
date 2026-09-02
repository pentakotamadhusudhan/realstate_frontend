import { useEffect } from 'react'
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix leaflet default marker icon
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

interface LocationPickerProps {
    lat: number | null
    lng: number | null
    onChange: (lat: number, lng: number) => void
}

function ClickHandler({ onChange }: { onChange: (lat: number, lng: number) => void }) {
    useMapEvents({
        click(e) {
            onChange(e.latlng.lat, e.latlng.lng)
        },
    })
    return null
}

export default function LocationPicker({ lat, lng, onChange }: LocationPickerProps) {
    const defaultCenter: [number, number] = [17.657503, 83.022970]
    const position: [number, number] | null = lat && lng ? [lat, lng] : null

    return (
        <div className="flex flex-col gap-2">
            <p className="text-gray-400 text-xs">
                🖱 Click anywhere on the map to set the venture center location
            </p>
            <div className="rounded-xl overflow-hidden border border-gray-700" style={{ height: '300px' }}>
                <MapContainer
                    center={position ?? defaultCenter}
                    zoom={15}
                    style={{ height: '100%', width: '100%' }}
                >
                    <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution='&copy; OpenStreetMap contributors'
                    />
                    <ClickHandler onChange={onChange} />
                    {position && <Marker position={position} />}
                </MapContainer>
            </div>
            {lat && lng && (
                <p className="text-green-400 text-xs">
                    ✅ Selected: {lat.toFixed(6)}, {lng.toFixed(6)}
                </p>
            )}
        </div>
    )
}