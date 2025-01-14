import { useCallback, useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import ImageViewer from 'react-simple-image-viewer';

import useStateWithLocalStorage from '../../hooks/useStateWithLocalStorage.jsx';

import SEO from '../../components/SEO.jsx';
import {
    Filter,
    InputFilter,
    ButtonGroupFilter,
    ButtonGroupFilterButton,
} from '../../components/filter/index.js';
import SmallItemTable from '../../components/small-item-table/index.js';
import QuestTable from '../../components/quest-table/index.js';
import TraderResetTime from '../../components/trader-reset-time/index.js';
import ErrorPage from '../error-page/index.js';
import Loading from '../../components/loading/index.js';
import LoadingSmall from '../../components/loading-small/index.js';
import PropertyList from '../../components/property-list/index.js';
import formatPrice from '../../modules/format-price.js';

import QueueBrowserTask from '../../modules/queue-browser-task.js';

import useTradersData from '../../features/traders/index.js';

import i18n from '../../i18n.js';

import './index.css';
import '../../styles/singleEntity.css'

const romanLevels = {
    0: '0',
    1: 'I',
    2: 'II',
    3: 'III',
    4: 'IV',
    5: 'V',
    6: 'VI',
    7: 'VII',
    8: 'VIII',
    9: 'IX',
    10: 'X'
};

function Trader() {
    const { traderName } = useParams();
    const defaultQuery = new URLSearchParams(window.location.search).get(
        'search',
    );
    const [nameFilter, setNameFilter] = useState(defaultQuery || '');
    const [selectedTable, setSelectedTable] = useStateWithLocalStorage(
        `${traderName.toLowerCase()}SelectedTable`,
        'spending',
    );
    //const [showAllTraders, setShowAllTraders] = useState(false);
    const { t } = useTranslation();

    const [isViewerOpen, setIsViewerOpen] = useState(false);
    const openImageViewer = useCallback(() => {
        setIsViewerOpen(true);
      }, []);
    const closeImageViewer = () => {
        setIsViewerOpen(false);
    };
    const backgroundStyle = {
        backgroundColor: 'rgba(0,0,0,.9)',
        zIndex: 20,
    };

    const handleNameFilterChange = useCallback(
        (e) => {
            if (typeof window !== 'undefined') {
                const name = e.target.value.toLowerCase();

                // schedule this for the next loop so that the UI
                // has time to update but we do the filtering as soon as possible
                QueueBrowserTask.task(() => {
                    setNameFilter(name);
                });
            }
        },
        [setNameFilter],
    );
    const { data: traders, status } = useTradersData();
    
    const trader = useMemo(() => {
        return traders.find(tr => tr.normalizedName === traderName.toLowerCase());;
    }, [traders, traderName]);

    const levelProperties = useMemo(() => {
        const props = {};
        if (!trader) {
            return props;
        }
        if (!Number.isInteger(selectedTable)) {
            return props;
        }
        const levelInfo = trader.levels.find(l => l.level === selectedTable);
        if (levelInfo.requiredPlayerLevel > 1) {
            props.requiredPlayerLevel = {value: levelInfo.requiredPlayerLevel, label: `${t('Player level')} 💪`};
        }
        props.requiredReputation = {value: levelInfo.requiredReputation, label: `${t('Reputation')} 📈`};
        if (levelInfo.requiredCommerce > 0) {
            props.requiredCommerce = {value: formatPrice(levelInfo.requiredCommerce, trader.currency.normalizedName), label: `${t('Commerce')} 💵`};
        }
        return props;
    }, [trader, selectedTable, t]);

    const buyBackTableEnabled = useMemo(() => {
        return trader?.levels.some(l => l.requiredCommerce > 0);
    }, [trader]);

    const traderOffersTableEnabled = useMemo(() => {
        return trader?.barters.length > 0;
    }, [trader]);

    if (!trader && (status === 'idle' || status === 'loading')) {
        return <Loading/>;
    }
    if (!trader)
        return <ErrorPage />;
    
    if (trader.normalizedName === 'btr-driver')
        return <ErrorPage />;
    
    let resetTime = (<LoadingSmall/>);
    if (trader.resetTime && trader.barters.length) {
        resetTime = (
            <TraderResetTime timestamp={trader.resetTime} locale={i18n.language} />
        );
    } else if (trader.resetTime) {
        resetTime = '';
    }
    return [
        <SEO 
            title={`${t('Trader {{trader}}', { trader: trader.name })} - ${t('Escape from Tarkov')} - ${t('Tarkov.dev')}`}
            description={t('trader-page-description', 'Get the latest information on the trader {{trader}} in Escape from Tarkov. Learn about the items he sells on certain Loyalty level and how to maximize your cash back money to level Loyalty.', { trader: trader.name })}
            image={`${window.location.origin}${process.env.PUBLIC_URL}/images/traders/${trader.normalizedName}-portrait.png`}
            card='summary_large_image'
            key="seo-wrapper"
        />,
        <div class="display-wrapper">
          <div className={'entity-page-wrapper'} key={'trader-page-display-wrapper'}> 
            <div className="entity-information-wrapper">
              <div className="entity-top-content">
                <img
                  alt={trader.name}
                  className={'entity-information-icon'}
                  loading="lazy"
                  src={`${process.env.PUBLIC_URL}/images/traders/${trader.normalizedName}-portrait.png`}
                  onClick={() => openImageViewer(0)}
                />
                <div className="title-bar">
                  <span class="type">
                    {t('Trader')}
                  </span>
                  <h1>
                    {trader.name}
                  </h1>
                  <span className="wiki-link-wrapper">
                    <a href={`https://escapefromtarkov.fandom.com/wiki/${trader.normalizedName}`} target="_blank" rel="noopener noreferrer">
                      {t('Wiki')}
                    </a>
                  </span>
                </div>
                <div className="main-content">
                  <p class="entity-details">
                    {trader.description}
                  </p>
                </div>
                <div className="entity-properties">
                  <PropertyList properties={levelProperties} />
                </div>
              </div>
              <div className="entity-icon-cont">
                <div className="entity-icon-and-link-wrapper"
                  onClick={() => openImageViewer(0)}
                  style={{ backgroundImage: `url(${process.env.PUBLIC_URL}/images/traders/${trader.normalizedName}.jpg)` }}
                />
              </div>
            </div>

            {isViewerOpen && (
                <ImageViewer
                    src={[`${process.env.PUBLIC_URL}/images/traders/${trader.normalizedName}.jpg`]}
                    currentIndex={0}
                    backgroundStyle={backgroundStyle}
                    disableScroll={true}
                    closeOnClickOutside={true}
                    onClose={closeImageViewer}
                />
            )}

            <div className="page-headline-wrapper">
              <h1>
                <cite>
                  {resetTime}
                </cite>
              </h1>
              <Filter center>
                {buyBackTableEnabled ? (
                  <ButtonGroupFilter>
                    <ButtonGroupFilterButton
                      tooltipContent={
                        <>
                          {t('Items with the best cash back prices for leveling')}
                        </>
                        }
                      selected={selectedTable === 'spending'}
                      content={t('Spending')}
                      type="text"
                      onClick={setSelectedTable.bind(undefined, 'spending')}
                    />
                    </ButtonGroupFilter>
                  ) : ''}
                  {traderOffersTableEnabled ? (
                    <ButtonGroupFilter>
                      {trader.levels.map(level => (
                        <ButtonGroupFilterButton
                          key={level.level}
                          tooltipContent={
                            <>
                              {t('Unlocks at Loyalty Level {{level}}', { level: level.level})}
                            </>
                          }
                          selected={selectedTable === level.level}
                          content={romanLevels[level.level]}
                          onClick={setSelectedTable.bind(undefined, level.level)}
                        />
                      ))}
                    </ButtonGroupFilter>
                  ) : ''}
                  <ButtonGroupFilter>
                  <ButtonGroupFilterButton
                    tooltipContent={
                      <>
                        {t('Tasks given by {{traderName}}', {traderName: trader.name})}
                      </>
                    }
                    selected={selectedTable === 'tasks'}
                    content={t('Tasks')}
                    type="text"
                    onClick={setSelectedTable.bind(undefined, 'tasks')}
                  />
                  </ButtonGroupFilter>
                  <InputFilter
                    defaultValue={nameFilter}
                    onChange={handleNameFilterChange}
                    placeholder={t('filter on item')}
                  />
              </Filter>
          </div>

          {selectedTable !== 'tasks' && (
            <SmallItemTable
              nameFilter={nameFilter}
              traderFilter={trader.normalizedName}
              loyaltyLevelFilter={Number.isInteger(selectedTable) ? selectedTable : false}
              traderBuybackFilter={selectedTable === 'spending' ? true : false}
              maxItems={selectedTable === 'spending' ? 50 : false}
              fleaPrice={selectedTable === 'spending' ? false : 1}
              traderOffer={selectedTable === 'spending' ? false : 2}
              cheapestPrice={selectedTable === 'spending' ? 1 : false}
              traderValue={selectedTable === 'spending' ? 2 : false}
              traderBuyback={selectedTable === 'spending' ? 3 : false}
              sortBy={selectedTable === 'spending' ? 'traderBuyback' : null}
              sortByDesc={true}
              showAllSources={selectedTable === 'spending' ? false : true}
            />
          )}
          {selectedTable === 'tasks' && (
            <QuestTable
              giverFilter={trader.normalizedName}
              nameFilter={nameFilter}
              questRequirements={1}
              minimumLevel={2}
            />
          )}
      </div>
    </div>,
    ];
}

export default Trader;
