import React, { Suspense, useCallback, useMemo, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { useParams, Link } from 'react-router-dom';
import ImageViewer from 'react-simple-image-viewer';

import { Icon } from '@mdi/react';
import { mdiDiamondStone, mdiMapLegend, mdiAccountGroup, mdiInvoiceTextClockOutline } from '@mdi/js';

import SEO from '../../components/SEO.jsx';
import CenterCell from '../../components/center-cell/index.js';
import ErrorPage from '../error-page/index.js';
import Loading from '../../components/loading/index.js';
import SmallItemTable from '../../components/small-item-table/index.js';
import DataTable from '../../components/data-table/index.js';
import PropertyList from '../../components/property-list/index.js';
import { getRelativeTimeAndUnit } from '../../modules/format-duration.js';

import capitalize from '../../modules/capitalize-first.js';

import useBossesData from '../../features/bosses/index.js';
import useItemsData from '../../features/items/index.js';
import { useMapImages } from '../../features/maps/index.js';

import i18n from '../../i18n.js';

import './index.css';
import '../../styles/singleEntity.css'

function BossPage(params) {
    const { t } = useTranslation();

    const { data: bosses } = useBossesData();

    const { data: items } = useItemsData();

    const allMaps = useMapImages();

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

    // Format the boss table columns for locations
    const columnsLocations = useMemo(() => {
        return [
            {
                Header: t('Map'),
                accessor: 'map',
                Cell: CenterCell
            },
            {
                Header: t('Spawn Location'),
                accessor: 'spawnLocations',
                Cell: CenterCell
            },
            {
                Header: t('Chance'),
                accessor: 'chance',
                Cell: CenterCell
            }
        ];
    }, [t]);

    // Format the boss table columns
    const columnsEscorts = useMemo(() => {
        return [
            {
                Header: t('Map'),
                accessor: 'map',
                Cell: CenterCell
            },
            {
                Header: t('Name'),
                accessor: 'name',
                Cell: (props) => {
                    if (bosses.some(boss => boss.normalizedName === props.row.original.normalizedName)) {
                        return (
                            <CenterCell>
                                <Link to={`/boss/${props.row.original.normalizedName}`}>
                                    {props.value}
                                </Link>
                            </CenterCell>
                        );
                    }
                    return <CenterCell value={props.value} nowrap />;
                },
            },
            {
                Header: t('Count'),
                accessor: 'count',
                Cell: CenterCell
            },
            {
                Header: t('Chance'),
                accessor: 'chance',
                Cell: CenterCell
            }
        ];
    }, [t, bosses]);

    const bossNameLower = params.bossName.toLowerCase();

    // If no bosses have been returned yet, return 'loading'
    if (!bosses || bosses.length === 0) {
        return <Loading />;
    }

    // Format the boss data
    //const bossSpawns = formatBossData(maps);

    // Get the correct individual boss data
    //var bossSpawnData = bossSpawns.find(boss => boss.normalizedName === bossNameLower);
    const bossData = bosses.find(boss => boss.normalizedName === bossNameLower);

    // If no boss data has been found, return the error page
    if (!bossData) {
        return <ErrorPage />;
    }

    const loot = [];
    let lootKeys = [];
    const attachmentMap = {};

    const lootValueCutoff = 80000;
    const getItemSlotValue = (item) => {
        if (!item)
            return 0;
        return item.sellFor.reduce((best, current) => {
            if (current.priceRUB > best) {
                return current.priceRUB;
            }
            return best;
        }, 0) / (item.slots);
    };
    gearLoop:
    for (const gear of bossData.equipment) {
        const item = items.find(it => it.id === gear.item.id);
        if (!item)
            continue;
        const itemValue = getItemSlotValue(item);
        if (item.types.includes('noFlea') || itemValue > lootValueCutoff) {
            loot.push(gear.item);
            attachmentMap[item.id] = gear.item.containsItems.map(ci => ci.item.id);
            continue;
        }
        for ( const attach of gear.item.containsItems) {
            const attachItem = items.find(it => it.id === attach.item.id);
            if (!attachItem) {
                continue;
            }
            const attachItemValue = getItemSlotValue(item);
            if (attachItem.types.includes('noFlea') || attachItemValue > lootValueCutoff) {
                loot.push(gear.item);
                attachmentMap[item.id] = gear.item.containsItems.map(ci => ci.item.id);
                continue gearLoop;
            }
        }
    }
    for (const lootItem of bossData.items) {
        const item = items.find(it => it.id === lootItem.id);
        if (!item)
            continue;
        const itemValue = getItemSlotValue(item);
        if (item.types.includes('noFlea')) {
            loot.push(lootItem);
            continue;
        }
        if (itemValue > lootValueCutoff) {
            if (item.types.includes('keys') && !item.normalizedName.includes('keycard') && !item.normalizedName.includes('marked')) {
                lootKeys.push(lootItem);
                continue;
            }
            loot.push(lootItem);
        }
    }
    loot.sort((a, b) => {
        const itemA = items.find(it => it.id === a.id);
        const itemB = items.find(it => it.id === b.id);
        return getItemSlotValue(itemB) - getItemSlotValue(itemA);
    });
    lootKeys.sort((a, b) => {
        const itemA = items.find(it => it.id === a.id);
        const itemB = items.find(it => it.id === b.id);
        return getItemSlotValue(itemB) - getItemSlotValue(itemA);
    });
    lootKeys = lootKeys.slice(0, 5);
    loot.push(...lootKeys);

    // Get static boss data from json file
    //var bossJsonData = bossJson.find(boss => boss.normalizedName === bossNameLower);

    // Collect a list of all maps without duplicates
    var bossMaps = [];
    for (const map of bossData.maps) {
        if (bossMaps.includes(map.name)) {
            continue;
        }
        bossMaps.push(map.name);
    }

    // Format the bossProperties data for the 'stats' section
    var bossProperties = {}
    bossProperties[t('Map') + ' 🗺️'] = bossMaps;

    // Collect spawn stats for each map
    var spawnStatsMsg = [];

    for (const map of bossData.maps) {
        // If a specific boss override exists, use that instead of the default from the API
        const spawnChanceOverride = bossData.spawnChanceOverride?.find(override => override.map === map.normalizedName);
        if (spawnChanceOverride) {
            spawnStatsMsg.push(`${spawnChanceOverride.chance * 100}% (${map.name})`);
            continue;
        }
        /*if (map.spawns.length === 1) {
            spawnStatsMsg.push(`${map.spawns[0].spawnChance * 100}% (${map.name})`);
            continue;
        }*/
        let lowerBound = 1;
        let upperBound = 0;
        for (const spawn of map.spawns) {
            lowerBound = lowerBound > spawn.spawnChance ? spawn.spawnChance : lowerBound;
            upperBound = upperBound < spawn.spawnChance ? spawn.spawnChance : upperBound;
        }
        upperBound = Math.round(upperBound * 100);
        lowerBound = Math.round(lowerBound * 100);
        let displayPercent = `${lowerBound}-${upperBound}`;
        if (lowerBound === upperBound || upperBound === 100) {
            displayPercent = upperBound;
        } 
        spawnStatsMsg.push(`${displayPercent}% (${map.name})`)
    }

    if (spawnStatsMsg.length > 0) {
        bossProperties['spawnChance'] = {
            value: spawnStatsMsg.join(', '),
            label: `${t('Spawn chance')} 🎲`,
            tooltip: t('Chance that the boss spawns on a given map'),
        };
    }

    // Display health stats
    if (bossData.health) {
        bossProperties['health'] = {
            value: bossData.health.reduce((totalHealth, current) => {
                totalHealth += current.max;
                return totalHealth;
            }, 0),
            label: `${t('Health')} 🖤`,
            tooltip: t('Total boss health'),
        };
    }

    // Display behavior info
    if (bossData.behavior) {
        bossProperties['behavior'] = {
            // t('Patrol')
            // t('Rush')
            // t('Stalker')
            // t('Hostile and accurate')
            // t('Patrol and highly armored')
            // t('Group patrol')
            // t('Frequent healing and stim injections')
            // t('Sniper')
            // t('Batshit insane')
            value: t(bossData.behavior),
            label: `${t('Behavior')} 💡`,
            tooltip: t("The boss's general AI behavior"),
        };
    }

    // Format the boss table spawnLocation data
    const spawnLocations = []
    for (const map of bossData.maps) {
        const mapStub = Object.values(allMaps).reduce((found, current) => {
            if (!found && current.key === `${map.normalizedName}-3d`) {
                found = current.key;
            }
            if (current.key === map.normalizedName) {
                found = current.key;
            }
            return found;
        }, false);
        let mapLink = false;
        if (mapStub) {
            mapLink = <Link to={`/map/${mapStub}`}>{map.name}</Link>
        }
        for (const spawn of map.spawns) {
            for (const location of spawn.locations) {
                const chance = map.spawns.length > 1 && location.chance === 1 ? spawn.spawnChance : location.chance;
                spawnLocations.push({
                    spawnLocations: location.name,
                    chance: `${parseInt(chance * 100)}%`,
                    map: mapLink || map.name
                });
            }
        }
    }

    // Format the boss table escorts data
    const escorts = []
    for (const map of bossData.maps) {
        const mapStub = Object.values(allMaps).reduce((found, current) => {
            if (!found && current.key === `${map.normalizedName}-3d`) {
                found = current.key;
            }
            if (current.key === map.normalizedName) {
                found = current.key;
            }
            return found;
        }, false);
        let mapLink = false;
        if (mapStub) {
            mapLink = <Link to={`/map/${mapStub}`}>{map.name}</Link>
        }
        for (const escort of map.escorts) {
            for (const amount of escort.amount) {
                escorts.push({
                    map: mapLink || map.name,
                    name: escort.name,
                    normalizedName: escort.normalizedName,
                    chance: `${parseInt(amount.chance * 100)}%`,
                    count: amount.count
                });
            }
        }
    }

    let report = '';
    if (bossData.reports?.length > 0) {
        report = (
            <div>
                <h2>
                    {t('Most recent reports')}
                    <Icon
                        path={mdiInvoiceTextClockOutline}
                        size={1.5}
                        className="icon-with-text"
                    />
                </h2>
                <ul>
                    {bossData.reports.map((report, index) => {
                        const reportedMap = Object.values(allMaps).find(m => m.id === report.map.id);
                        let relativeTime = getRelativeTimeAndUnit(new Date(parseInt(report.timestamp)).getTime());
                        return (
                            <li key={`report-${index}`}>{reportedMap.name}: {t('{{val, relativetime}}', { val: relativeTime[0], range: relativeTime[1] })}</li>
                        );
                    })}
                </ul>
            </div>
        );
    }

    // Return the main react component for the boss page
    return [
        <div className="display-wrapper" key={'boss-display-wrapper'}>
            <div className={'entity-page-wrapper'} key={'boss-page-display-wrapper'}>
                <div className="entity-information-wrapper">
                  <div className="entity-top-content">
                    <img
                        alt={bossData.name}
                        className={'entity-information-icon'}
                        loading="lazy"
                        src={bossData.imagePortraitLink}
                        onClick={() => openImageViewer(0)}
                    />
                    <div className="title-bar">
                      <span class="type">{t('Boss')}</span>
                      <h1>{bossData.name}</h1>

                      {bossData.wikiLink &&
                        <span className="wiki-link-wrapper">
                            <a href={bossData.wikiLink} target="_blank" rel="noopener noreferrer">
                                {t('Wiki')}
                            </a>
                        </span>
                      }
                    </div>
                    <div className="main-content">
                      {i18n.exists(`${bossData.normalizedName}-bio`, { ns: 'bosses' }) &&
                        <p className='entity-details'>
                          <Trans i18nKey={`${bossData.normalizedName}-bio`} ns={'bosses'} />
                        </p>
                      }
                      {i18n.exists(`${bossData.normalizedName}-description`, { ns: 'bosses' }) && t(`${bossData.normalizedName}-description`, { ns: 'bosses' }).length > 0 &&
                        <div>
                          <h3>{t('Behavior')}</h3>
                          <p className='entity-details'>
                            <Trans i18nKey={`${bossData.normalizedName}-description`} ns={'bosses'} />
                          </p>
                        </div>
                      }
                    </div>
                    <div className="entity-properties">
                      <PropertyList properties={bossProperties} />
                      {report}
                    </div>
                  </div>
                  <div className="entity-icon-cont">
                    <div className="entity-icon-and-link-wrapper"
                      onClick={() => openImageViewer(0)}
                      style={{ backgroundImage: `url(${bossData.imagePosterLink})` }}
                    />
                  </div>
                </div>

                {isViewerOpen && (
                  <ImageViewer
                    src={[bossData.imagePosterLink]}
                    currentIndex={0}
                    backgroundStyle={backgroundStyle}
                    disableScroll={true}
                    closeOnClickOutside={true}
                    onClose={closeImageViewer}
                  />
                )}

                <div className="information-section boss-loot has-table">
                  <h2 key={'boss-loot-header'}>
                    <Icon
                      path={mdiDiamondStone}
                      size={1.5}
                      className="icon-with-text"
                    />
                    {t('Special Boss Loot')}
                  </h2>
                  <SmallItemTable
                    idFilter={loot.reduce((prev, current) => {
                      prev.push(current.id);
                      return prev;
                    }, [])}
                    attachmentMap={attachmentMap}
                    showGunDefaultPresetImages={true}
                    fleaValue
                    traderValue
                  />
                </div>

                <div className="information-section spawn-locations has-table">
                  {spawnStatsMsg.length > 0 && 
                  <>
                  <h2 key={'boss-spawn-table-header'}>
                    <Icon
                      path={mdiMapLegend}
                      size={1.5}
                      className="icon-with-text"
                    />
                    {t('Spawn Locations')}
                  </h2>
                  <ul>
                    <Trans i18nKey="boss-spawn-table-description">
                      <li>Map: The name of the map which the boss can spawn on</li>
                      <li>Spawn Location: The exact location on the given map which the boss can spawn</li>
                      <li>Chance: If the "Spawn Chance" is activated for the map, this is the estimated chance that the boss will spawn at a given location on that map</li>
                    </Trans>
                  </ul>
                  <DataTable
                      key="boss-spawn-table"
                      columns={columnsLocations}
                      data={spawnLocations}
                      disableSortBy={false}
                      sortBy={'map'}
                      autoResetSortBy={false}
                  />
                </>}
              </div>

              <div className="information-section boss-escorts has-table">
                <h2 key={'boss-escort-table-header'}>
                    <Icon
                      path={mdiAccountGroup}
                      size={1.5}
                      className="icon-with-text"
                    />
                    {t('Boss Escorts')}
                </h2>
                <div className="content">
                  {escorts.length > 0 ?
                    <DataTable
                      key="boss-escort-table"
                      columns={columnsEscorts}
                      data={escorts}
                      disableSortBy={false}
                      sortBy={'map'}
                      autoResetSortBy={false}
                    />
                    :
                    <p>{t('This boss does not have any escorts')}</p>
                  }
                </div>
              </div>
            </div>
        </div>
    ]
}

function Boss() {
    const { t } = useTranslation();
    
    // Get the boss name from the url
    const { bossName } = useParams();
    // Capitalize the first letter of the boss name
    const boss = capitalize(bossName);

    // Return the main react component for the individual boss page
    return [
        <SEO 
            title={`${boss} - ${t('Escape from Tarkov')} - ${t('Tarkov.dev')}`}
            description={t('boss-page-description', 'This page includes information on {{bossName}} location, loot, and strategies for defeating him.', { bossName: boss })}
            url={`https://tarkov.dev/boss/${bossName}`}
            image={`${window.location.origin}${process.env.PUBLIC_URL}/images/traders/${bossName}-portrait.png`}
            card='summary_large_image'
            key="seo-wrapper"
        />,
        <Suspense fallback={<Loading />} key={`suspense-boss-page-${bossName}`}>
            <BossPage bossName={bossName} />
        </Suspense>
    ];
}

export default Boss;
