import { Plot } from "@/types/plot";

export const plots: Plot[] = [
    {
        id: "1",
        plotNumber: "A-101",
        plotName: "Premium Corner Plot",
        areaSqft: 2400,
        price: 3600000,
        status: "available",
        description: "North-East facing premium corner plot.",
        coordinates: [
            { lat: 17.38580, lng: 78.48620 },
            { lat: 17.38580, lng: 78.48634 },
            { lat: 17.38568, lng: 78.48635 },
            { lat: 17.38567, lng: 78.48621 },
        ],
    },

    // Remaining 19 plots...
];

export const townshipFeatures = {
    entranceGate: {
        lat: 17.38595,
        lng: 78.48650,
    },

    park: [
        { lat: 17.38548, lng: 78.48636 },
        { lat: 17.38548, lng: 78.48664 },
        { lat: 17.38538, lng: 78.48664 },
        { lat: 17.38538, lng: 78.48636 },
    ],

    clubhouse: [
        { lat: 17.38500, lng: 78.48636 },
        { lat: 17.38500, lng: 78.48664 },
        { lat: 17.38492, lng: 78.48664 },
        { lat: 17.38492, lng: 78.48636 },
    ],
};