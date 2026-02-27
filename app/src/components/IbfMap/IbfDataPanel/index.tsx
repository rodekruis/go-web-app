import { CountryData } from '#utils/ibfMap';
import styles from './styles.module.css';

interface IbfDataPanelProps {
    selectedCountry: string;
}


export function IbfDataPanel({ selectedCountry }: IbfDataPanelProps) {
    const countryInfo = selectedCountry ? CountryData.get(selectedCountry) : null;

    return (
        <div className={styles.dataContainer}>
            { countryInfo ? (
                <div>
                    <p><strong>{countryInfo.name_en}</strong></p>
                    <p>IBF Supported: {countryInfo.ibfSupported ? 'Yes' : 'No'}</p>
                </div>
            ) :
                <p>No country selected.</p>
            }
        </div>
    );
}
