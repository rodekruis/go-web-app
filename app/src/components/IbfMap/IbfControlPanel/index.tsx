import { useState } from "react";
import {
  type AllEventsData,
  type EventOverviewData,
} from "#utils/ibfMapHelpers";
import styles from "./styles.module.css";
import { Button } from "@ifrc-go/ui";
import { ChevronDownLineIcon, ChevronUpLineIcon } from "@ifrc-go/icons";

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
 * Formats event start date for display.
 */
function formatStartDate(startDate: string): string {
  const start = new Date(startDate);
  return start.toLocaleDateString("en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

/**
 * Formats date for footer display.
 */
function formatFooterDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

/**
 * Collapsible section component.
 */
function CollapsibleSection({
  title,
  children,
  defaultOpen = false,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className={styles.collapsibleSection}>
      <button
        type="button"
        className={styles.sectionHeader}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className={styles.sectionHeaderLeft}>
          <span>{title}</span>
        </span>
        {isOpen ? <ChevronUpLineIcon /> : <ChevronDownLineIcon />}
      </button>
      {isOpen && <div className={styles.sectionContent}>{children}</div>}
    </div>
  );
}

/**
 * Detail view for a selected event with layer toggle buttons.
 */
function EventDetailView({
  event,
  onBack,
  onToggleFloodExtents,
  onTogglePopulation,
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
      {/* Back Button */}
      <button type="button" className={styles.backButton} onClick={onBack}>
        &larr; Back
      </button>

      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <span className={styles.headerTitle}>{event.eventName}</span>
        </div>
        <span className={styles.severityBadge}>{event.alertLevel}</span>
      </div>

      {/* Event Info */}
      <div className={styles.eventInfo}>
        <div className={styles.infoRow}>
          <span>Started on: {formatStartDate(event.startDate)}</span>
        </div>
        <div className={styles.infoRow}>
          <span>
            {admin1Regions.map((r) => r.adminName).join(", ") || "N/A"}
          </span>
        </div>
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

      {/* Population Exposure Section */}
      <CollapsibleSection title="Population Exposure" defaultOpen={true}>
        <div className={styles.statsRow}>
          <div className={styles.statItem}>
            <span className={styles.statLabel}>Total Exposed Districts</span>
            <span className={styles.statValue}>{exposedDistrictsCount}</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statLabel}>Total People Exposed</span>
            <span className={styles.statValue}>
              {totalPopulation.toLocaleString()}
            </span>
          </div>
        </div>
        <div className={styles.statItemFull}>
          <span className={styles.statLabel}>Total Households Exposed</span>
          <span className={styles.statValue}>
            {totalHouseholds.toLocaleString()}
          </span>
        </div>

        {/* District Table */}
        <div className={styles.districtTable}>
          <div className={styles.districtTableHeader}>
            <span>District name</span>
            <span>Exposed Population</span>
          </div>
          {admin3Regions.map((district) => (
            <div key={district.adminCode} className={styles.districtTableRow}>
              <span>{district.adminName}</span>
              <span>{district.impactedPopulation.toLocaleString()}</span>
            </div>
          ))}
        </div>
      </CollapsibleSection>

      {/* Infrastructure Exposure Section */}
      {infraExposure && (
        <CollapsibleSection title="Infrastructure Exposure">
          <div className={styles.infraItem}>
            <span className={styles.infraLabel}>Available Shelters</span>
            <span className={styles.infraValue}>
              {infraExposure.shelters[0]} / {infraExposure.shelters[1]}
            </span>
          </div>
          <div className={styles.infraGrid}>
            <div className={styles.infraItem}>
              <span className={styles.infraLabel}>Exposed Roads</span>
              <span className={styles.infraValue}>
                {infraExposure.roads[0].toLocaleString()}km /{" "}
                {infraExposure.roads[1].toLocaleString()}km
              </span>
            </div>
            <div className={styles.infraItem}>
              <span className={styles.infraLabel}>Exposed Water Points</span>
              <span className={styles.infraValue}>
                {infraExposure.waterPoints[0]} / {infraExposure.waterPoints[1]}
              </span>
            </div>
          </div>
          <div className={styles.infraGrid}>
            <div className={styles.infraItem}>
              <span className={styles.infraLabel}>Exposed Schools</span>
              <span className={styles.infraValue}>
                {infraExposure.schools[0]} / {infraExposure.schools[1]}
              </span>
            </div>
            <div className={styles.infraItem}>
              <span className={styles.infraLabel}>Exposed Health Clinics</span>
              <span className={styles.infraValue}>
                {infraExposure.clinics[0]} / {infraExposure.clinics[1]}
              </span>
            </div>
          </div>
        </CollapsibleSection>
      )}

      {/* Data Sources Section */}
      <CollapsibleSection title="Data sources Source">
        {Object.entries(event.dataSources).map(
          ([source, confidence], index) => (
            <div key={source} className={styles.sourceItem}>
              <span className={styles.sourceLabel}>
                {index === 0 ? "Forecast Source" : "Data Source"}: {source}
              </span>
              <span className={styles.confidenceBadge}>
                {confidence}% confidence
              </span>
            </div>
          ),
        )}
      </CollapsibleSection>

      {/* Footer */}
      <div className={styles.footer}>
        Event created on: {formatFooterDate(event.eventCreatedDate)}. Last
        updated on: {formatFooterDate(event.eventLastUpdatedDate)}
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
    return `Starts in ${diffDays} day${diffDays === 1 ? "" : "s"}`;
  }
  return `Starts in ${diffHours} hour${diffHours === 1 ? "" : "s"}`;
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
      <Button name={event.eventId} onClick={() => onEventClick(event.eventId)}>
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
  countryCode,
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
