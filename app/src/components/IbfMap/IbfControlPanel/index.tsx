import { useState } from 'react';
import { type AllEventsData, type EventOverviewData } from '#utils/ibfMapHelpers';
import styles from './styles.module.css';
import {
    Button,
} from '@ifrc-go/ui';

interface EventButtonProps {
    event: EventOverviewData;
    onEventClick: (eventId: string) => void;
}

interface EventDetailViewProps {
    event: EventOverviewData;
    onBack: () => void;
    onToggleFloodExtents: (rasterImageId: string) => void;
    onTogglePopulation: () => void;
}

/**
 * Formats event time relative to now - shows "starting in X" for future, "started on Date" for past.
 */
function formatEventTime(startDate: string): string {
    const now = new Date();
    const start = new Date(startDate);
    const diffMs = start.getTime() - now.getTime();
    
    if (diffMs <= 0) {
        // Past start time - show the date
        return `Started on ${start.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric', 
            year: 'numeric' 
        })}`;
    }
    
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    const remainingHours = diffHours % 24;
    
    if (diffDays > 0) {
        return `Starting in ${diffDays} day${diffDays === 1 ? '' : 's'}${remainingHours > 0 ? `, ${remainingHours} hour${remainingHours === 1 ? '' : 's'}` : ''}`;
    }
    return `Starting in ${diffHours} hour${diffHours === 1 ? '' : 's'}`;
}

/**
 * Detail view for a selected event with layer toggle buttons.
 */
function EventDetailView({ 
    event, 
    onBack, 
    onToggleFloodExtents, 
    onTogglePopulation 
}: EventDetailViewProps) {
    // Get admin data at different levels
    const admin0 = event.affectedAdminRegions[0]?.[0];
    const admin1Regions = event.affectedAdminRegions[1] ?? [];
    const admin3Regions = event.affectedAdminRegions[3] ?? [];
    
    const totalPopulation = admin0?.impactedPopulation ?? 0;
    const totalHouseholds = admin0?.impactedHouseholds ?? 0;
    const exposedDistrictsCount = admin3Regions.length;
    const infraExposure = admin0?.infrastructureExposure;

    return (
        <div className={styles.eventDetailView}>
            <Button name="back" onClick={onBack} className={styles.backButton}>
                &larr; Back
            </Button>
            
            <h3>{event.eventName}</h3>
            <div className={styles.eventAlert}>{event.alertLevel}</div>
            
            {/* Event Timing */}
            <div className={styles.detailSection}>
                <div className={styles.sectionLabel}>Event Time</div>
                <div>{formatEventTime(event.startDate)}</div>
            </div>

            {/* Regions */}
            <div className={styles.detailSection}>
                <div className={styles.sectionLabel}>Regions</div>
                <div>{admin1Regions.map(r => r.adminName).join(', ') || 'N/A'}</div>
            </div>

            {/* Raster Layer Buttons */}
            <div className={styles.buttonGroup}>
                {event.rasterImageId && (
                    <Button 
                        name="toggleFlood" 
                        onClick={() => onToggleFloodExtents(event.rasterImageId!)}
                    >
                        Toggle flood extents
                    </Button>
                )}
                
                <Button name="togglePopulation" onClick={onTogglePopulation}>
                    Toggle population
                </Button>
            </div>

            {/* Population Exposure Summary */}
            <div className={styles.detailSection}>
                <div className={styles.sectionLabel}>Population Exposure</div>
                <div className={styles.statsGrid}>
                    <div className={styles.statItem}>
                        <span className={styles.statValue}>{exposedDistrictsCount}</span>
                        <span className={styles.statLabel}>Exposed Districts</span>
                    </div>
                    <div className={styles.statItem}>
                        <span className={styles.statValue}>{totalPopulation.toLocaleString()}</span>
                        <span className={styles.statLabel}>Total People Exposed</span>
                    </div>
                    <div className={styles.statItem}>
                        <span className={styles.statValue}>{totalHouseholds.toLocaleString()}</span>
                        <span className={styles.statLabel}>Total Households Exposed</span>
                    </div>
                </div>
            </div>

            {/* List of Affected Districts (ADM3) */}
            <div className={styles.detailSection}>
                <div className={styles.sectionLabel}>Affected Districts</div>
                <ul className={styles.districtList}>
                    {admin3Regions.map((district) => (
                        <li key={district.adminCode}>
                            {district.adminName} ({district.impactedPopulation.toLocaleString()} people)
                        </li>
                    ))}
                </ul>
            </div>

            {/* Infrastructure Exposure */}
            {infraExposure && (
                <div className={styles.detailSection}>
                    <div className={styles.sectionLabel}>Infrastructure Exposure</div>
                    <div className={styles.infraGrid}>
                        <div className={styles.infraItem}>
                            <span className={styles.infraLabel}>Shelters</span>
                            <span>{infraExposure.shelters[0]} / {infraExposure.shelters[1]} exposed</span>
                        </div>
                        <div className={styles.infraItem}>
                            <span className={styles.infraLabel}>Roads (km)</span>
                            <span>{infraExposure.roads[0].toLocaleString()} / {infraExposure.roads[1].toLocaleString()} exposed</span>
                        </div>
                        <div className={styles.infraItem}>
                            <span className={styles.infraLabel}>Schools</span>
                            <span>{infraExposure.schools[0]} / {infraExposure.schools[1]} exposed</span>
                        </div>
                        <div className={styles.infraItem}>
                            <span className={styles.infraLabel}>Water Points</span>
                            <span>{infraExposure.waterPoints[0]} / {infraExposure.waterPoints[1]} exposed</span>
                        </div>
                        <div className={styles.infraItem}>
                            <span className={styles.infraLabel}>Clinics</span>
                            <span>{infraExposure.clinics[0]} / {infraExposure.clinics[1]} exposed</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Data Sources */}
            <div className={styles.detailSection}>
                <div className={styles.sectionLabel}>Data Sources</div>
                <div className={styles.sourcesList}>
                    {Object.entries(event.dataSources).map(([source, confidence]) => (
                        <div key={source} className={styles.sourceItem}>
                            <span>{source}</span>
                            <span className={styles.confidence}>{confidence}% confidence</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

/**
 * Formats the start time relative to now.
 */
function formatStartTime(startDate: string): string {
    const now = new Date();
    const start = new Date(startDate);
    const diffMs = start.getTime() - now.getTime();
    
    if (diffMs <= 0) {
        return "Ongoing";
    }
    
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffDays > 0) {
        return `Starts in ${diffDays} day${diffDays === 1 ? '' : 's'}`;
    }
    return `Starts in ${diffHours} hour${diffHours === 1 ? '' : 's'}`;
}

/**
 * Displays a single event with its affected regions and population.
 */
function EventButton({ event, onEventClick }: EventButtonProps) {
    // Get admin0 (country level) for total population
    const admin0 = event.affectedAdminRegions[0]?.[0];
    const totalPopulation = admin0?.impactedPopulation ?? 0;

    // Get admin1 regions for affected areas
    const admin1Regions = event.affectedAdminRegions[1] ?? [];

    // Get admin3 count for exposed districts
    const admin3Regions = event.affectedAdminRegions[3] ?? [];
    const exposedDistrictsCount = admin3Regions.length;

    const startTimeLabel = formatStartTime(event.startDate);

    return (
        <div className={styles.eventCard}>
            <div className={styles.eventTitle}>{event.eventName}</div>
            <div className={styles.eventAlert}>{event.alertLevel}</div>
            <div className={styles.eventDetails}>
                <div>{startTimeLabel}</div>
                <div>Population: {totalPopulation.toLocaleString()}</div>
                <div>Exposed districts: {exposedDistrictsCount}</div>
                <div>
                    Affected regions:
                    <ul className={styles.regionList}>
                        {admin1Regions.map((region) => (
                            <li key={region.adminCode}>{region.adminName}</li>
                        ))}
                    </ul>
                </div>
            </div>
            <Button
                name={event.eventId}
                onClick={() => onEventClick(event.eventId)}
            >
                View event &gt;
            </Button>
        </div>
    );
}

interface IbfControlPanelProps {
    eventData: AllEventsData;
    onEventClick: (eventId: string) => void;
    onToggleFloodExtents: (rasterImageId: string) => void;
    onTogglePopulation: () => void;
    onHideAllLayers: () => void;
    countryCode: string;
}

/**
 * Control panel showing upcoming events for the selected country.
 * Each event displays affected admin1 regions and total population.
 */
export function IbfControlPanel({ 
    eventData, 
    onEventClick, 
    onToggleFloodExtents,
    onTogglePopulation,
    onHideAllLayers,
    countryCode 
}: IbfControlPanelProps) {
    const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
    const events = Object.values(eventData);
    const selectedEvent = selectedEventId ? eventData[selectedEventId] : null;

    const handleEventClick = (eventId: string) => {
        setSelectedEventId(eventId);
        onEventClick(eventId);
    };

    const handleBack = () => {
        onHideAllLayers();
        setSelectedEventId(null);
    };

    // Show detail view if an event is selected
    if (selectedEvent) {
        return (
            <div className={styles.dataContainer}>
                <EventDetailView
                    event={selectedEvent}
                    onBack={handleBack}
                    onToggleFloodExtents={onToggleFloodExtents}
                    onTogglePopulation={onTogglePopulation}
                />
            </div>
        );
    }

    if (events.length === 0) {
        return (
            <div className={styles.dataContainer}>
                <p>No upcoming events for {countryCode}</p>
            </div>
        );
    }

    return (
        <div className={styles.dataContainer}>
            <h3>Upcoming Events ({countryCode})</h3>
            {events.map((event) => (
                <EventButton
                    key={event.eventId}
                    event={event}
                    onEventClick={handleEventClick}
                />
            ))}
        </div>
    );
}