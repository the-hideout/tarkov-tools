import { useState, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import React, { lazy, Suspense } from 'react';

import QueueBrowserTask from '../../modules/queue-browser-task';
import mapData from '../../data/maps.json';
import ItemIconList from '../../components/item-icon-list';
import { useTradersQuery } from '../../features/traders/queries';

import Icon from '@mdi/react';
import {
    mdiAccountGroup,
    mdiAmmunition,
    mdiHammerWrench,
    mdiFinance,
    mdiAccountSwitch,
    mdiProgressWrench,
    mdiMap,
    mdiViewGrid,
    mdiDiscord,
    mdiHome,
    mdiCalendarClock,
} from '@mdi/js';

import './index.css';

import categoryPages from '../../data/category-pages.json';

const DISCORD_STASH_INVITE_LINK = 'https://discord.com/api/oauth2/authorize?client_id=955521336904667227&permissions=309237664832&scope=bot%20applications.commands'

// Lazy loading React component text (fallback)
// https://web.dev/code-splitting-suspense/?utm_source=lighthouse&utm_medium=wpt
const renderLoader = () => <p>Loading...</p>;

// Use Lazy and Suspense to load these components
const ServerStatus = lazy(() => import('../../components/server-status'));
const SmallItemTable = lazy(() => import('../../components/small-item-table'));
const ItemSearch = lazy(() => import('../../components/item-search'));

function Start() {
    const defaultQuery = new URLSearchParams(window.location.search).get(
        'search',
    );
    const [nameFilter, setNameFilter] = useState(defaultQuery || '');
    const { t } = useTranslation();
    const { data: traders } = useTradersQuery();

    const handleNameFilterChange = useCallback(
        (value) => {
            if (typeof window !== 'undefined') {
                // schedule this for the next loop so that the UI
                // has time to update but we do the filtering as soon as possible
                QueueBrowserTask.task(() => {
                    setNameFilter(value);
                });
            }
        },
        [setNameFilter],
    );

    const [loadMoreState, setLoadMoreState] = useState(false);
    const loadMore = event => {
        setLoadMoreState(current => !current);
    };

    return [
        <Helmet key={'loot-tier-helmet'}>
            <meta charSet="utf-8" />
            <title>{t(`Tarkov.dev - Escape from Tarkov`)}</title>
            <meta
                name="description"
                content={`Checkout all information for items, crafts, barters, maps, loot tiers, hideout profits, trader details, a free API, and more with tarkov.dev! A free, community made, and open source ecosystem of Escape from Tarkov tools and guides.`}
            />
        </Helmet>,
        <div
            className="display-wrapper page-wrapper start-wrapper"
            key={'display-wrapper'}
        >
            <div className="start-section-wrapper item-section">
                <Suspense fallback={renderLoader()}>
                    <ItemSearch
                        onChange={handleNameFilterChange}
                        autoFocus={true}
                    />
                </Suspense>
                <Suspense fallback={renderLoader()}>
                    {!loadMoreState && [<SmallItemTable
                        key={'small-item-table-initial'}
                        maxItems={20}
                        nameFilter={nameFilter}
                        defaultRandom={true}
                        autoScroll={false}
                        fleaValue
                        traderValue
                        instaProfit
                        hideBorders
                    />,
                    <div className="load-more-wrapper" key={"load-more-div"}>
                        <button id="load-more-button" className="load-more-button" onClick={loadMore}>Load More</button>
                    </div>
                    ]}

                    {loadMoreState && (
                        <SmallItemTable
                            key={'load-more-items'}
                            maxItems={20}
                            nameFilter={nameFilter}
                            defaultRandom={true}
                            autoScroll={true}
                            fleaValue
                            traderValue
                            instaProfit
                            hideBorders
                        />
                    )}
                </Suspense>
            </div>
            <div className="start-section-wrapper">
                <Suspense fallback={renderLoader()}>
                    <ServerStatus key={"server-status"} />
                </Suspense>
                <h3>
                    <Icon
                        path={mdiHammerWrench}
                        size={1}
                        className="icon-with-text"
                    />
                    {t('Tools')}
                </h3>
                <ul className="tools-list">
                    <li>
                        <Link to="/ammo/" key={"ammo-page"}>
                            <Icon
                                path={mdiAmmunition}
                                size={1}
                                className="icon-with-text"
                            />
                            {t('Ammo Chart')}
                        </Link>
                    </li>
                    <li>
                        <Link to="/loot-tier/" key={"loot-tier-page"}>
                            <Icon
                                path={mdiFinance}
                                size={1}
                                className="icon-with-text"
                            />
                            {t('Loot tiers')}
                        </Link>
                    </li>
                    <li>
                        <Link to="/barters/" key={"barters-page"}>
                            <Icon
                                path={mdiAccountSwitch}
                                size={1}
                                className="icon-with-text"
                            />
                            {t('Barter trades')}
                        </Link>
                    </li>
                    <li>
                        <Link to="/hideout-profit/" key={"hideout-profit-page"}>
                            <Icon
                                path={mdiProgressWrench}
                                size={1}
                                className="icon-with-text"
                            />
                            {t('Hideout crafts')}
                        </Link>
                    </li>
                    <li>
                        <a
                            href={DISCORD_STASH_INVITE_LINK}
                        >
                            <Icon
                                path={mdiDiscord}
                                size={1}
                                className="icon-with-text"
                            />
                            {t('Discord bot')}
                        </a>
                    </li>
                    <li>
                        <Link to="/hideout" key={"hideout-page"}>
                            <Icon
                                path={mdiHome}
                                size={1}
                                className="icon-with-text"
                            />
                            {t('Hideout build costs')}
                        </Link>
                    </li>
                    <li>
                        <Link to="/wipe-length" key={"wipe-length-page"}>
                            <Icon
                                path={mdiCalendarClock}
                                size={1}
                                className="icon-with-text"
                            />
                            {t('Wipe length')}
                        </Link>
                    </li>
                </ul>
                <h3>
                    <Link to={'/maps'} key={"maps-page"}>
                        <Icon
                            path={mdiMap}
                            size={1}
                            className="icon-with-text"
                        />
                        {t('Maps')}
                    </Link>
                </h3>
                <ul>
                    {mapData.map((mapData) => {
                        return (
                            <li key={`map-link-${mapData.key}`}>
                                <Link to={`/map/${mapData.key}`}>
                                    {mapData.displayText}
                                </Link>
                            </li>
                        );
                    })}
                </ul>
                <h3>
                    <Link to={'/items'} key={"items-page"}>
                        <Icon
                            path={mdiViewGrid}
                            size={1}
                            className="icon-with-text"
                        />
                        {t('Items')}
                    </Link>
                </h3>
                <ul>
                    {categoryPages.map((categoryPage) => {
                        return (
                            <li key={`start-link-to-${categoryPage.key}`}>
                                <Link to={`/items/${categoryPage.key}`}>
                                    <Icon
                                        path={ItemIconList(categoryPage.icon)}
                                        size={1}
                                        className="icon-with-text"
                                    />
                                    {t(categoryPage.displayText)}
                                </Link>
                            </li>
                        );
                    })}
                </ul>
                <h3>
                    <Link to={'/traders'} key={"traders-page"}>
                        <Icon
                            path={mdiAccountGroup}
                            size={1}
                            className="icon-with-text"
                        />
                        {t('Traders')}
                    </Link>
                </h3>
                <ul className="traders-list">
                    {traders?.map(trader=> {
                        return (
                            <li>
                                <Link to={`/traders/${trader.normalizedName}`} key={'sidebar-'+trader.id}>
                                    <img
                                        alt={trader.name+' icon'}
                                        className="trader-icon"
                                        loading="lazy"
                                        src={`${process.env.PUBLIC_URL}/images/${trader.normalizedName}-icon.jpg`}
                                    />
                                    {trader.name}
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            </div>
            <div className='info-text-wrapper'>
                <Link className="branding" to="/" key={"branding"}>
                    <img
                        alt="Tarkov.dev"
                        height={30}
                        width={186}
                        loading="lazy"
                        src={`${process.env.PUBLIC_URL}/tarkov-dev-logo.svg`}
                        className='main-logo'
                    />
                </Link>
                <h1 className='main-h1 main-headers'>tarkov.dev is an open source tool kit for Escape from Tarkov.</h1>
                <h2 className='main-h2 main-headers'>It is designed and maintained by the community to help you with quests, flea market trading, and improving your game! The API is also freely available for you to build your own tools and services related to EFT.</h2>
            </div>
        </div>,
    ];
}

export default Start;
