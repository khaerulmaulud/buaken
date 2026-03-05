"use client";

import {
  AlertCircle,
  Loader2,
  MapPin,
  Navigation,
  RefreshCw,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Map,
  MapControls,
  MapMarker,
  MarkerContent,
} from "@/components/ui/map";
import { useGeolocation } from "@/hooks/useGeolocation";

interface LocationPickerProps {
  onLocationSelect: (lat: number, lng: number) => void;
  initialLat?: number;
  initialLng?: number;
  buttonText?: string;
  buttonVariant?: "default" | "outline" | "secondary" | "ghost";
  className?: string;
}

export function LocationPicker({
  onLocationSelect,
  initialLat,
  initialLng,
  buttonText = "Set Location",
  buttonVariant = "outline",
  className = "",
}: LocationPickerProps) {
  const [open, setOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(
    initialLat && initialLng ? { lat: initialLat, lng: initialLng } : null,
  );

  const { position, error, isLoading, isSupported, refetch } = useGeolocation({
    enableHighAccuracy: true,
    timeout: 15000,
  });

  // Update selected location when geolocation changes
  useEffect(() => {
    if (position && !selectedLocation) {
      setSelectedLocation({
        lat: position.latitude,
        lng: position.longitude,
      });
    }
  }, [position, selectedLocation]);

  const handleMapClick = (lng: number, lat: number) => {
    setSelectedLocation({ lat, lng });
  };

  const handleUseCurrentLocation = () => {
    if (position) {
      setSelectedLocation({
        lat: position.latitude,
        lng: position.longitude,
      });
    } else {
      refetch();
    }
  };

  const handleConfirm = () => {
    if (selectedLocation) {
      onLocationSelect(selectedLocation.lat, selectedLocation.lng);
      setOpen(false);
    }
  };

  const defaultCenter: [number, number] = selectedLocation
    ? [selectedLocation.lng, selectedLocation.lat]
    : position
      ? [position.longitude, position.latitude]
      : [106.8456, -6.2088]; // Default to Jakarta

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={buttonVariant} className={className}>
          <MapPin className="mr-2 h-4 w-4" />
          {buttonText}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Select Location</DialogTitle>
          <DialogDescription>
            Click on the map or use your current location
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Status Banner */}
          {isLoading && (
            <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg text-blue-700 dark:text-blue-300">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Getting your location...</span>
            </div>
          )}

          {error && (
            <div className="flex items-center justify-between gap-2 p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg text-amber-700 dark:text-amber-300">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm">
                  {error.code === 1
                    ? "Location access denied"
                    : "Could not get location"}
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={refetch}
                className="h-8"
              >
                <RefreshCw className="h-3 w-3" />
              </Button>
            </div>
          )}

          {/* Map */}
          <div className="h-64 rounded-lg overflow-hidden border">
            <Map center={defaultCenter} zoom={15} onClick={handleMapClick}>
              <MapControls position="top-right" showZoom showCompass />

              {selectedLocation && (
                <MapMarker
                  longitude={selectedLocation.lng}
                  latitude={selectedLocation.lat}
                >
                  <MarkerContent>
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-teal-500 text-white shadow-lg border-2 border-white animate-bounce">
                      <MapPin className="h-5 w-5" />
                    </div>
                  </MarkerContent>
                </MapMarker>
              )}

              {position && !selectedLocation && (
                <MapMarker
                  longitude={position.longitude}
                  latitude={position.latitude}
                >
                  <MarkerContent>
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500 text-white shadow-lg border-2 border-white">
                      <div className="h-2 w-2 rounded-full bg-white" />
                    </div>
                  </MarkerContent>
                </MapMarker>
              )}
            </Map>
          </div>

          {/* Current Location Button */}
          <Button
            variant="outline"
            onClick={handleUseCurrentLocation}
            disabled={!isSupported || isLoading}
            className="w-full"
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Navigation className="mr-2 h-4 w-4" />
            )}
            Use Current Location
          </Button>

          {/* Coordinates Display */}
          {selectedLocation && (
            <Card className="bg-muted/50">
              <CardContent className="p-3">
                <p className="text-xs text-muted-foreground mb-1">
                  Selected Coordinates
                </p>
                <p className="font-mono text-sm">
                  {selectedLocation.lat.toFixed(6)},{" "}
                  {selectedLocation.lng.toFixed(6)}
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!selectedLocation}
            className="bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600"
          >
            Confirm Location
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Simple component to display current location
export function CurrentLocationDisplay({
  className = "",
}: {
  className?: string;
}) {
  const { position, error, isLoading, refetch } = useGeolocation({
    watch: true,
    enableHighAccuracy: true,
  });

  if (isLoading) {
    return (
      <div className={`flex items-center gap-2 text-sm ${className}`}>
        <Loader2 className="h-4 w-4 animate-spin text-primary" />
        <span className="text-muted-foreground">Getting location...</span>
      </div>
    );
  }

  if (error) {
    return (
      <button
        onClick={refetch}
        className={`flex items-center gap-2 text-sm text-amber-600 hover:text-amber-700 ${className}`}
      >
        <AlertCircle className="h-4 w-4" />
        <span>Enable location</span>
      </button>
    );
  }

  if (position) {
    return (
      <div className={`flex items-center gap-2 text-sm ${className}`}>
        <div className="relative">
          <Navigation className="h-4 w-4 text-primary" />
          <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-green-500 animate-pulse" />
        </div>
        <span className="text-muted-foreground">
          Location active (±{Math.round(position.accuracy)}m)
        </span>
      </div>
    );
  }

  return null;
}
