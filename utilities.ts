import { flags, getGlobals, infoWindowContent } from './globals';
import { loadMarkerLayer, placeNewMarker, updateSize, hideAllMarkers, showAllMarkers, removeAllMarkers } from './markerFacilities';
import { readGeoJSONFile, clearSecondaryLayer, loadGeoJsonString, loadGeoJSONFile, select, removeAllFeatures } from './geojsonFacilities';

export function colog(a) {
    if (flags.debugMode) console.log(a);
}

// Define a function that partially applies another function
export function partial(fn, ...fixedArgs) {
    return function (...freeArgs) {
        return fn(...freeArgs, ...fixedArgs);
    };
}

export function isNonNegativeNumber(value: unknown): boolean {
    return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

export function removeAccentsAndUpperCase(str) {
    return str
        .normalize('NFD') // Normalize the string to decompose accented characters
        .replace(/[\u0300-\u036f]/g, '') // Remove diacritical marks
        .toUpperCase(); // Convert to uppercase
}

export function splitCamelCase(name: any) {
    let result = '';
    for (let i = 0; i < name.length; i++) {
        const char = name[i];
        // Check if the character is uppercase and not the first character
        if (char !== char.toLowerCase() && i !== 0 && name[i - 1] !== '-') {
            // If it's uppercase and not the first character, add a space before it
            result += ' ';
        }
        // Add the current character to the result
        result += char;
    }
    return result;
}

export function resolveToNumber(input: number | (() => number)): number {
    return typeof input === "number" ? input : input();
}

export function renameFile(originalFile, newName) {
    return new File([originalFile], newName, {
        type: originalFile.type,
        lastModified: originalFile.lastModified,
    });
}

export function getRandomArray(n: number): number[] {
    if (n <= 0) {
      throw new Error("Input must be a positive integer.");
    }
  
    // Create an array [1, 2, ..., n]
    const arr = Array.from({ length: n }, (_, i) => i + 1);
  
    // Fisher-Yates shuffle algorithm
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1)); // Random index from 0 to i
      [arr[i], arr[j]] = [arr[j], arr[i]]; // Swap elements
    }
  
    return arr;
  }
  
  /**
* Calculates the distance between two google.maps.LatLng points using the Haversine formula.
*
* @param {google.maps.LatLng} point1 - The first point.
* @param {google.maps.LatLng} point2 - The second point.
* @returns {number} - The distance between the two points in kilometers.
*/
export function calculateDistance(point1, point2) {
    const toRadians = (degrees) => degrees * (Math.PI / 180);

    const R = 6371; // Radius of the Earth in kilometers
    const lat1 = point1.lat();
    const lng1 = point1.lng();
    const lat2 = point2.lat();
    const lng2 = point2.lng();

    const dLat = toRadians(lat2 - lat1);
    const dLng = toRadians(lng2 - lng1);

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRadians(lat1)) *
        Math.cos(toRadians(lat2)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in kilometers
}

// Function to get all files in a specific folder
function getFilesInFolder(zipInstance, folderName) {
    return Object.keys(zipInstance.files).filter((filePath) => {
        return filePath.startsWith(folderName) && !zipInstance.files[filePath].dir;
    });
}

export async function loadZipLayer(path: string): Promise<void> {

    let response = await fetch(path);
    if (!response.ok) {
        console.log(path + " does not exist");
    }
    else {
        const jszip = new JSZip();
        const blob = await response.blob();
        //const zip = await jszip.loadAsync(blob);
        try {
            const zip = await jszip.loadAsync(new File([blob], path, { type: blob.type })); // Load the ZIP file. There is an example in the code to turn blob to file
            readZip(zip);
        } catch (error) {
            console.error("Error handling ZIP file:", error);
            colog("An error occurred while processing the ZIP file.");
        }
        // const contentType = response.headers.get('Content-Type');
        // if (contentType && contentType.includes('application/zip')) {
        //     let markerLocData = await response.json();
        //     for (let markerLoc of markerLocData) {
        //         let position = { lat: markerLoc.lat, lng: markerLoc.lng };
        //         let text = markerLoc.text.toString();
        //         let imagepath = imagepathdir + text;
        //         //console.log(imagepath);
        //         placeNewMarker(getGlobals().map, position, text, imagepath, markerLoc.type, markerLoc.fszl, false);
        //     }
        // }
    }
}

export async function readZip(zip) {
    const folderNames = Object.keys(zip.files).filter(name => name.endsWith("/"));
    const fileNames = Object.keys(zip.files).filter(name => !name.endsWith("/"));
    const imageDir = folderNames.find(name => name.endsWith(" Images/"));
    if (!imageDir) {
        colog("No image directory found in the main folder.");
        return;
    }
    const geojsonDir = folderNames.find(name => name.endsWith(" geojson/"));
    if (!geojsonDir) {
        colog("No geojson directory found in the main folder.");
        return;
    }
    const jsonFile = fileNames.find(name => name.endsWith(".ggmm.json"));
    if (!jsonFile) {
        colog("No .ggmm.json file found in the main folder.");
        return;
    }

    // Load all markers
    const jsonContent = await zip.files[jsonFile].async("string");
    const markerLocData = JSON.parse(jsonContent);
    for (let markerLoc of markerLocData) {
        let position = { lat: markerLoc.lat, lng: markerLoc.lng };
        let text = markerLoc.text.toString();
        colog(text);
        let imagePath = "";
        const fileName = Object.keys(zip.files).find((name => {
            let baseName = name;
            const hasSlash = name.includes("/");
            if (hasSlash) baseName = name.split("/").pop();
            colog(baseName);
            return baseName === text;
    }));
        if (fileName) {
            const fileBlob = await zip.file(fileName).async("blob");
            imagePath = URL.createObjectURL(fileBlob);
        }
        placeNewMarker(getGlobals().map, position, text, imagePath, markerLoc.type, markerLoc.fszl);
    }

    //Load all geojson
    const geoimagesDir = folderNames.find(name => name.endsWith(" geoimages/"));
    const geotextDir = folderNames.find(name => name.endsWith(" geotext/"));
    colog(geojsonDir);
    const geojsonNames = getFilesInFolder(zip, geojsonDir);
    geojsonNames.forEach(async (name) => {

        // The geojson itself
        const geojsonFile = zip.files[name];
        if (!geojsonFile) {
            throw new Error(`File not found: ${name}`);
        }
        const blob = await geojsonFile.async("blob");
        readGeoJSONFile(new File([blob], name, { type: blob.type }));

        // The geotext
        let txtContent = "";
        const baseName = name.substring(0, name.lastIndexOf('.')).substring(name.indexOf('/') + 1) || name;
        const txtPath = geotextDir + baseName + '.txt';
        const txtFile = zip.files[txtPath]
        if (txtFile) txtContent = await zip.files[txtPath].async("string");

        // The geoimage
        let imagePreview: HTMLImageElement | null = null;
        let storedImageFile: File | null = null;
        const imagePrefix = geoimagesDir + baseName;
        const geoimagesFile = zip.files[Object.keys(zip.files).filter(name => name.startsWith(imagePrefix))];
        if (geoimagesFile) {
            const imgblob = await geoimagesFile.async("blob");
            storedImageFile = new File([imgblob], name, { type: imgblob.type });
            imagePreview = document.createElement("img");
            imagePreview.style.maxWidth = "100%";
            imagePreview.style.maxHeight = "100%";
            imagePreview.style.borderRadius = "4px";
            imagePreview.style.padding = "8px";
            imagePreview.style.display = "none";
            const reader = new FileReader();
            reader.onload = (event) => {
                if (imagePreview) {
                    imagePreview.src = event.target?.result as string;
                    imagePreview.style.display = "block";
                }
            };
            reader.readAsDataURL(storedImageFile);
        }

        // Update indoWindowContent
        const newContent: infoWindowContent = {
            text: txtContent,
            img: imagePreview,
            imgFile: storedImageFile
        }
        infoWindowContent[name] = newContent;
    })
}

export function createButtonContainer(
    buttonText: string,
    onClick: () => void
): HTMLDivElement {
    // Create the container div
    const div = document.createElement("div");
    div.style.display = "inline-block"; // Ensures no extra spacing

    // Create the button
    const button = document.createElement("button");
    button.textContent = buttonText;

    // Remove padding and margins
    button.style.margin = "0";
    button.style.padding = "0";
    button.style.border = "none"; // Optional: removes the border

    // Add custom click event listener
    button.addEventListener("click", onClick);

    // Append button to div
    div.appendChild(button);

    return div;
}
