import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Turnstile } from '@marsidev/react-turnstile';
import { Icon } from '@mdi/react';
import {
    mdiAccountDetails,
    mdiTrophy,
    mdiChartLine,
    mdiBagPersonal,
    mdiArmFlex,
    mdiStarBox,
    mdiTrophyAward,
    mdiAccountSearch,
    mdiDownloadBox,
    mdiFolderOpen,
    mdiGavel,
} from '@mdi/js';
import { SimpleTreeView, TreeItem } from '@mui/x-tree-view';
import Tippy from '@tippyjs/react';
import 'tippy.js/dist/tippy.css';

import SEO from '../../components/SEO.jsx';
import DataTable from '../../components/data-table/index.js';
import ItemImage from '../../components/item-image/index.js';
import ArrowIcon from '../../components/data-table/Arrow.js';
import ItemNameCell from '../../components/item-name-cell/index.js';

import useItemsData from '../../features/items/index.js';
import useMetaData from '../../features/meta/index.js';
import useAchievementsData from '../../features/achievements/index.js';

import playerStats from '../../modules/player-stats.mjs';
import { wipeDetails } from '../../modules/wipe-length.js';

import './index.css';

function getDHMS(seconds) {
    // calculate (and subtract) whole days
    const secondsPerDay = 24 * 60 * 60;
    const days = Math.floor(seconds / secondsPerDay);
    seconds -= days * secondsPerDay;

    // calculate (and subtract) whole hours
    const secondsPerHour = secondsPerDay / 24;
    const hours = Math.floor(seconds / secondsPerHour) % 24;
    seconds -= hours * secondsPerHour;

    // calculate (and subtract) whole minutes
    const minutes = Math.floor(seconds / 60) % 60;
    seconds -= minutes * 60;

    return {
        days,
        hours,
        minutes,
        seconds,
    };
}

const raritySort = {
    common: 0,
    rare: 1,
    legendary: 2,
};

const memberFlags = {
    Developer: 1,
    EOD: 2,
    ChatModerator: 32,
    Sherpa: 256,
    Emissary: 512,
    Unheard: 1024,
};

function Player() {
    const turnstileRef = useRef();
    const inputFile = useRef();
    const { t } = useTranslation();
    const params = useParams();
    const navigate = useNavigate();

    const gameMode = params.gameMode;

    const [accountId, setAccountId] = useState(params.accountId);

    useEffect(() => {
        setAccountId(params.accountId);
    }, [params, setAccountId]);

    const [playerData, setPlayerData] = useState({
        aid: 0,
        info: {
            nickname: t('Loading'),
            side: t('Loading'),
            experience: 0,
            memberCategory: 0,
            bannedState: false,
            bannedUntil: 0,
        },
        customization: {},
        skills: {},
        equipment: {},
        achievements: {},
        favoriteItems: [],
        pmcStats: {},
        scavStats: {},
    });
    const [profileError, setProfileError] = useState(false);
    //console.log(playerData);
    const { data: items } = useItemsData();
    const { data: metaData } = useMetaData();
    const { data: achievements } = useAchievementsData();
    const [turnstileToken, setTurnstileToken] = useState();
    const [playerBanned, setPlayerBanned] = useState();
    const bannedButtonRef = useRef();

    const fetchProfile = useCallback(async () => {
        const token = turnstileRef?.current?.getResponse();
        if (!token) {
            return;
        }
        if (!accountId) {
            return;
        }
        if (isNaN(accountId)) {
            try {
                const searchResponse = await playerStats.searchPlayers(
                    accountId,
                    gameMode,
                    turnstileToken,
                );
                if (turnstileRef.current?.reset) {
                    turnstileRef.current.reset();
                }
                for (const result of searchResponse) {
                    if (result.name.toLowerCase() === accountId.toLowerCase()) {
                        navigate(`/players/${gameMode}/${result.aid}`);
                        return;
                    }
                }
                setProfileError(`Account ${accountId} not found`);
            } catch (error) {
                setProfileError(`Error searching for profile ${accountId}: ${error.message}`);
            }
            return;
        }
        try {
            setPlayerData(await playerStats.getProfile(accountId, gameMode, turnstileToken));
            if (turnstileRef.current?.reset) {
                turnstileRef.current.reset();
            }
        } catch (error) {
            setProfileError(error.message);
        }
    }, [
        accountId,
        setPlayerData,
        setProfileError,
        navigate,
        turnstileToken,
        turnstileRef,
        gameMode,
    ]);

    const checkBanned = useCallback(async () => {
        const token = turnstileRef?.current?.getResponse();
        if (!token) {
            return;
        }
        if (!playerData?.info?.nickname) {
            return;
        }
        try {
            const searchResponse = await playerStats.searchPlayers(
                playerData.info.nickname,
                gameMode,
                turnstileToken,
            );
            if (turnstileRef.current?.reset) {
                turnstileRef.current.reset();
            }
            for (const result of searchResponse) {
                if (result.name === playerData.info.nickname || result.aid === playerData.aid) {
                    setPlayerBanned(false);
                    return;
                }
            }
            setPlayerBanned(true);
        } catch (error) {
            console.log(
                `Error checking banned status for ${playerData.info.nickname}: ${error.message}`,
            );
        }
        return false;
    }, [playerData, setPlayerBanned, turnstileToken, turnstileRef, gameMode]);

    const downloadProfile = useCallback(() => {
        if (!playerData.aid) {
            return;
        }
        const element = document.createElement('a');
        const file = new Blob([JSON.stringify(playerData, null, 4)], { type: 'application/json' });
        element.href = URL.createObjectURL(file);
        element.download = `${playerData.aid}.json`;
        document.body.appendChild(element); // Required for this to work in FireFox
        element.click();
    }, [playerData]);

    const loadProfile = useCallback(
        (e) => {
            e.preventDefault();
            const reader = new FileReader();
            reader.onload = async (e) => {
                const text = e.target.result;
                try {
                    const data = JSON.parse(text);
                    data.saved = true;
                    setPlayerData(data);
                    window.history.replaceState(null, null, `/players/${gameMode}/${data.aid}`);
                } catch (error) {
                    setProfileError('Error reading profile');
                }
            };
            reader.readAsText(e.target.files[0]);
        },
        [setPlayerData, setProfileError, gameMode],
    );

    const currentWipe = wipeDetails()[0];

    const playerLevel = useMemo(() => {
        if (playerData.info.experience === 0) {
            return 0;
        }
        let expTotal = 0;
        for (let i = 0; i < metaData.playerLevels.length; i++) {
            const levelData = metaData.playerLevels[i];
            expTotal += levelData.exp;
            if (expTotal === playerData.info.experience) {
                return levelData.level;
            }
            if (expTotal > playerData.info.experience) {
                return metaData.playerLevels[i - 1].level;
            }
        }
        return metaData.playerLevels[metaData.playerLevels.length - 1].level;
    }, [playerData, metaData]);

    const pageTitle = useMemo(() => {
        if (!playerData.aid) {
            return t('Loading...');
        }
        return t('{{playerName}} - level {{playerLevel}} {{playerSide}}', {
            playerName: playerData.info.nickname,
            playerLevel,
            playerSide: playerData.info.side,
        });
    }, [playerData, playerLevel, t]);

    const accountCategories = useMemo(() => {
        if (!playerData?.info?.memberCategory) {
            return '';
        }
        const flags = [];
        for (const flagName of Object.keys(memberFlags)) {
            const flag = memberFlags[flagName];
            if (playerData.info.memberCategory & flag) {
                flags.push(t(flagName));
            }
        }
        return <div>{flags.join(', ')}</div>;
    }, [playerData, t]);

    const lastActiveDate = useMemo(() => {
        if (!playerData.skills.Common) {
            return '';
        }
        let latest = 0;
        for (const skill of playerData.skills.Common) {
            if (skill.LastAccess > latest) {
                latest = skill.LastAccess;
            }
        }
        for (const timestamp of Object.values(playerData.achievements)) {
            if (timestamp > latest) {
                latest = timestamp;
            }
        }
        if (latest === 0) {
            return '';
        }
        return (
            <div>
                {t('Last active: {{date}}', { date: new Date(latest * 1000).toLocaleString() })}
            </div>
        );
    }, [playerData, t]);

    const achievementColumns = useMemo(() => {
        const cols = [
            {
                Header: () => (
                    <div style={{ textAlign: 'left', paddingLeft: '10px' }}>{t('Name')}</div>
                ),
                id: 'name',
                accessor: 'name',
            },
            {
                Header: () => (
                    <div style={{ textAlign: 'left', paddingLeft: '10px' }}>{t('Description')}</div>
                ),
                id: 'description',
                accessor: 'description',
            },
            {
                Header: t('Player %'),
                id: 'playersCompletedPercent',
                accessor: 'adjustedPlayersCompletedPercent',
                Cell: (props) => {
                    return <div className="center-content">{props.value}%</div>;
                },
            },
            {
                Header: t('Completed'),
                id: 'completionDate',
                accessor: 'completionDate',
                Cell: (props) => {
                    return (
                        <div
                            className={`center-content${new Date(props.value * 1000) > currentWipe.start ? ' current-wipe-achievement' : ''}`}
                        >
                            {new Date(props.value * 1000).toLocaleString()}
                        </div>
                    );
                },
            },
            {
                Header: t('Rarity'),
                id: 'rarity',
                accessor: 'rarity',
                Cell: (props) => {
                    return (
                        <div className={`center-content ${props.row.original.normalizedRarity}`}>
                            {props.value}
                        </div>
                    );
                },
                sortType: (rowA, rowB) => {
                    let rowAr = raritySort[rowA.original.normalizedRarity];
                    let rowBr = raritySort[rowB.original.normalizedRarity];
                    if (rowAr === rowBr) {
                        return (
                            rowB.original.playersCompletedPercent -
                            rowA.original.playersCompletedPercent
                        );
                    }
                    return rowAr - rowBr;
                },
            },
        ];
        if (gameMode !== 'regular') {
            //cols.splice(2, 1);
        }
        return cols;
    }, [t, currentWipe, gameMode]);

    const achievementsData = useMemo(() => {
        return (
            achievements
                ?.map((a) => {
                    if (!playerData.achievements[a.id]) {
                        return false;
                    }
                    return {
                        ...a,
                        completionDate: playerData.achievements[a.id],
                    };
                })
                .filter(Boolean) || []
        );
    }, [achievements, playerData]);

    const raidsColumns = useMemo(
        () => [
            {
                Header: <div style={{ textAlign: 'left', paddingLeft: '10px' }}>{t('Side')}</div>,
                id: 'side',
                accessor: 'side',
                Cell: (props) => {
                    return t(props.value);
                },
            },
            {
                Header: <div style={{ textAlign: 'left', paddingLeft: '10px' }}>{t('Raids')}</div>,
                id: 'raids',
                accessor: 'raids',
            },
            {
                Header: (
                    <div style={{ textAlign: 'left', paddingLeft: '10px' }}>{t('Survived')}</div>
                ),
                id: 'survived',
                accessor: 'survived',
            },
            {
                Header: (
                    <div style={{ textAlign: 'left', paddingLeft: '10px' }}>{t('Runthrough')}</div>
                ),
                id: 'runthrough',
                accessor: 'runthrough',
                Cell: (props) => {
                    return props.value;
                },
            },
            {
                Header: <div style={{ textAlign: 'left', paddingLeft: '10px' }}>{t('MIA')}</div>,
                id: 'mia',
                accessor: 'mia',
                Cell: (props) => {
                    return props.value;
                },
            },
            {
                Header: <div style={{ textAlign: 'left', paddingLeft: '10px' }}>{t('KIA')}</div>,
                id: 'kia',
                accessor: 'kia',
                Cell: (props) => {
                    return props.value;
                },
            },
            {
                Header: <div style={{ textAlign: 'left', paddingLeft: '10px' }}>{t('Kills')}</div>,
                id: 'kills',
                accessor: 'kills',
                Cell: (props) => {
                    return props.value;
                },
            },
            {
                Header: (
                    <div style={{ textAlign: 'left', paddingLeft: '10px' }}>
                        {t('K:D', { nsSeparator: '|' })}
                    </div>
                ),
                id: 'kdr',
                accessor: 'kills',
                Cell: (props) => {
                    return (props.value / props.row.original.kia).toFixed(2);
                },
            },
            {
                Header: (
                    <div style={{ textAlign: 'left', paddingLeft: '10px' }}>{t('Win Streak')}</div>
                ),
                id: 'streak',
                accessor: 'streak',
                Cell: (props) => {
                    return props.value;
                },
            },
        ],
        [t],
    );

    const raidsData = useMemo(() => {
        if (!playerData.pmcStats?.eft) {
            return [];
        }
        const statSides = { scavStats: 'Scav', pmcStats: 'PMC' };
        const statTypes = [
            {
                name: 'raids',
                key: ['Sessions'],
            },
            {
                name: 'survived',
                key: ['ExitStatus', 'Survived'],
            },
            {
                name: 'runthrough',
                key: ['ExitStatus', 'Runner'],
            },
            {
                name: 'mia',
                key: ['ExitStatus', 'Left'],
            },
            {
                name: 'kia',
                key: ['ExitStatus', 'Killed'],
            },
            {
                name: 'kills',
                key: ['Kills'],
            },
            {
                name: 'streak',
                key: ['LongestWinStreak'],
            },
        ];
        const getStats = (side) => {
            return {
                side,
                ...statTypes.reduce((all, s) => {
                    all[s.name] = 0;
                    return all;
                }, {}),
            };
        };
        const totalStats = getStats('Total');
        const statsData = [totalStats];
        for (const sideKey in statSides) {
            const sideLabel = statSides[sideKey];
            const stats = playerData[sideKey].eft.overAllCounters.Items;
            const currentData = getStats(sideLabel);
            for (const st of statTypes) {
                const foundStat = stats.find(
                    (s) => !st.key.some((keyPart) => !s.Key.includes(keyPart)),
                );
                currentData[st.name] = foundStat?.Value || 0;
                totalStats[st.name] += currentData[st.name];
            }
            statsData.push(currentData);
        }
        return statsData;
    }, [playerData]);

    const skillsColumns = useMemo(
        () => [
            {
                Header: <div style={{ textAlign: 'left', paddingLeft: '10px' }}>{t('Skill')}</div>,
                id: 'skill',
                accessor: 'skill',
                Cell: (props) => {
                    return props.value;
                },
            },
            {
                Header: <div style={{ textAlign: 'left', paddingLeft: '10px' }}>{t('Level')}</div>,
                id: 'progress',
                accessor: 'progress',
                Cell: (props) => {
                    return (props.value / 100).toFixed(2);
                },
            },
            {
                Header: (
                    <div style={{ textAlign: 'left', paddingLeft: '10px' }}>{t('Last Access')}</div>
                ),
                id: 'lastAccess',
                accessor: 'lastAccess',
                Cell: (props) => {
                    return new Date(props.value * 1000).toLocaleString();
                },
            },
        ],
        [t],
    );

    const skillsData = useMemo(() => {
        return (
            playerData.skills?.Common?.map((s) => {
                if (!s.Progress || s.LastAccess <= 0) {
                    return false;
                }
                const skill = metaData.skills.find((skill) => skill.id === s.Id);
                return {
                    skill: skill?.name || s.Id,
                    progress: s.Progress,
                    lastAccess: s.LastAccess,
                };
            }).filter(Boolean) || []
        );
    }, [playerData, metaData]);

    const masteringColumns = useMemo(
        () => [
            {
                id: 'expander',
                Header: ({ getToggleAllRowsExpandedProps, isAllRowsExpanded }) =>
                    // <span {...getToggleAllRowsExpandedProps()}>
                    //     {isAllRowsExpanded ? 'v' : '>'}
                    // </span>
                    null,
                Cell: ({ row }) =>
                    // Use the row.canExpand and row.getToggleRowExpandedProps prop getter
                    // to build the toggle for expanding a row
                    row.canExpand ? (
                        <span
                            {...row.getToggleRowExpandedProps({
                                style: {
                                    // We can even use the row.depth property
                                    // and paddingLeft to indicate the depth
                                    // of the row
                                    // paddingLeft: `${row.depth * 2}rem`,
                                },
                            })}
                        >
                            {row.isExpanded ? (
                                <ArrowIcon />
                            ) : (
                                <ArrowIcon className={'arrow-right'} />
                            )}
                        </span>
                    ) : null,
            },
            {
                Header: <div style={{ textAlign: 'left', paddingLeft: '10px' }}>{t('Weapon')}</div>,
                id: 'name',
                accessor: 'name',
                Cell: (props) => {
                    if (props.row.original.shortName) {
                        return <ItemNameCell item={props.row.original} items={items} />;
                    }
                    return props.value;
                },
            },
            {
                Header: (
                    <div style={{ textAlign: 'left', paddingLeft: '10px' }}>{t('Progress')}</div>
                ),
                id: 'Progress',
                accessor: 'Progress',
                Cell: (props) => {
                    if (props.row.original.shortName) {
                        return '';
                    }
                    return props.value + ` (${props.row.original.level})`;
                },
                sortType: (a, b) => {
                    const aValue = a.original;
                    const bValue = b.original;
                    const diff = aValue.level - bValue.level;
                    if (diff !== 0) {
                        return diff;
                    }
                    return aValue.Progress - bValue.Progress;
                },
            },
        ],
        [t, items],
    );

    const masteringData = useMemo(() => {
        return (
            playerData.skills?.Mastering?.map((masteringProgress) => {
                const mastering = metaData.mastering.find(
                    (m) => m.id === String(masteringProgress.Id),
                );
                if (!mastering) {
                    return false;
                }
                let level = 1;
                if (masteringProgress.Progress > mastering.level3) {
                    level = 3;
                } else if (masteringProgress.Progress > mastering.level2) {
                    level = 2;
                }
                return {
                    ...masteringProgress,
                    name: masteringProgress.Id,
                    level,
                    subRows: mastering.weapons
                        .map((w) => {
                            const baseItem = items.find((i) => i.id === w.id);
                            if (!baseItem) {
                                return false;
                            }
                            const preset = items.find(
                                (i) => i.id === baseItem.properties.defaultPreset?.id,
                            );
                            return {
                                ...baseItem,
                                itemLink: `/item/${baseItem.normalizedName}`,
                                iconLink: preset ? preset.iconLink : baseItem.iconLink,
                                Progress: masteringProgress.Progress,
                                level,
                            };
                        })
                        .filter(Boolean),
                };
            }).filter(Boolean) || []
        );
    }, [playerData, metaData, items]);

    const totalTimeInGame = useMemo(() => {
        const totalSecondsInGame = playerData.pmcStats?.eft?.totalInGameTime || 0;
        if (!totalSecondsInGame) {
            return '';
        }
        const { days, hours, minutes, seconds } = getDHMS(totalSecondsInGame);
        const formattedTime = t('{{hours}} h, {{minutes}} m, {{seconds}} s', {
            hours: (days * 24) + hours,
            minutes,
            seconds,
        });
        return <p>{`${t('Total account time in game')}: ${formattedTime}`}</p>;
    }, [playerData, t]);

    const getItemDisplay = useCallback(
        (loadoutItem, imageOptions = {}) => {
            let item = items.find((i) => i.id === loadoutItem._tpl);
            if (!item) {
                return undefined;
            }
            if (item.properties?.defaultPreset) {
                const preset = items.find((i) => i.id === item.properties.defaultPreset.id);
                item = {
                    ...item,
                    width: preset.width,
                    height: preset.height,
                    iconLink: preset.iconLink,
                    baseImageLink: preset.baseImageLink,
                    image512pxLink: preset.image512pxLink,
                    image8xLink: preset.image8xLink,
                    inspectImageLink: preset.inspectImageLink,  
                };
            }
            let countLabel;

            let label = '';
            if (loadoutItem.upd?.StackObjectsCount > 1) {
                countLabel = loadoutItem.upd?.StackObjectsCount;
            }
            if (loadoutItem.upd?.Dogtag) {
                const tag = loadoutItem.upd.Dogtag;
                const weapon = items.find((i) => i.id === tag.WeaponName?.split(' ')[0]);
                countLabel = tag.Level;
                let killerInfo = <span>{tag.KillerName}</span>;
                if (tag.KillerAccountId) {
                    killerInfo = (
                        <Link to={`/players/${gameMode}/${tag.KillerAccountId}`}>
                            {tag.KillerName}
                        </Link>
                    );
                }
                let victimInfo = <span>{tag.Nickname}</span>;
                if (tag.AccountId !== '0') {
                    victimInfo = (
                        <Link to={`/players/${gameMode}/${tag.AccountId}`}>{tag.Nickname}</Link>
                    );
                }
                label = (
                    <span>
                        {victimInfo}
                        <span>{` ${t(tag.Status)} `}</span>
                        {killerInfo}
                        {weapon !== undefined && [
                            <span key={'weapon-using-label'}>{` ${t('using')} `}</span>,
                            <Link
                                key={`weapon-using ${weapon.id}`}
                                to={`/item/${weapon.normalizedName}`}
                            >
                                {weapon.shortName}
                            </Link>,
                        ]}
                        <div>{` ${new Date(tag.Time).toLocaleString()}`}</div>
                    </span>
                );
            }
            if (loadoutItem.upd?.Key) {
                const key = items.find((i) => i.id === loadoutItem._tpl);
                if (key) {
                    if (key.properties.uses) {
                        countLabel = `${key.properties.uses - loadoutItem.upd.Key.NumberOfUsages}/${key.properties.uses}`;
                    } else {
                        countLabel = loadoutItem.upd.Key.NumberOfUsages;
                    }
                }
            }
            if (loadoutItem.upd?.Repairable) {
                countLabel = `${loadoutItem.upd.Repairable.Durability.toFixed(2)}/${loadoutItem.upd.Repairable.MaxDurability}`;
            }
            if (loadoutItem.upd?.MedKit) {
                const item = items.find((i) => i.id === loadoutItem._tpl);
                if (item?.properties?.uses || item?.properties?.hitpoints) {
                    countLabel = `${loadoutItem.upd.MedKit.HpResource}/${item.properties?.uses || item.properties?.hitpoints}`;
                }
            }

            const itemImage = (
                <ItemImage
                    item={item}
                    imageField={imageOptions?.imageField || 'image512pxLink'} // issue #1000 original imageOptions?.imageField || baseImageLink
                    linkToItem={imageOptions?.linkToItem}
                    count={countLabel}
                    maxImageWidth={256}
                    maxImageHeight={256}
                    responsive={true}
                />
            );
            return { image: itemImage, label };
        },
        [items, t, gameMode],
    );

    const getLoadoutContents = useCallback(
        (parentItem, itemType = 'loadout') => {
            const itemSource =
                itemType === 'loadout' ? playerData?.equipment?.Items : playerData?.favoriteItems;
            return itemSource?.reduce((contents, loadoutItem) => {
                if (loadoutItem.parentId !== parentItem._id) {
                    return contents;
                }
                const itemDisplay = getItemDisplay(loadoutItem);
                if (!itemDisplay) {
                    return contents;
                }
                contents.push(
                    <TreeItem
                        key={`${itemType}-item-${loadoutItem._id}`}
                        itemId={loadoutItem._id}
                        slots={{
                            icon: () => {
                                return itemDisplay.image;
                            },
                        }}
                        label={itemDisplay.label}
                    >
                        {getLoadoutContents(loadoutItem, itemType)}
                    </TreeItem>,
                );
                return contents;
            }, []);
        },
        [playerData, getItemDisplay],
    );

    const getLoadoutInSlot = useCallback(
        (slot) => {
            if (playerData?.equipment?.Id === undefined) {
                return 'None';
            }

            let loadoutRoot = playerData.equipment.Items.find(
                (i) => i._id === playerData.equipment.Id,
            );
            let loadoutItem = playerData.equipment.Items.find(
                (i) => i.slotId === slot && i.parentId === loadoutRoot._id,
            );

            if (loadoutItem === undefined) {
                return 'None';
            }

            let itemImage = undefined;
            let itemLabel = '';
            let contents = [];
            let itemDisplay = getItemDisplay(loadoutItem);
            if (itemDisplay) {
                itemImage = itemDisplay.image;
            } else {
                itemLabel = slot;
            }
            contents.push(
                <TreeItem
                    key={`loadout-item-${loadoutItem._id}`}
                    itemId={loadoutItem._id}
                    slots={{
                        icon: () => {
                            return itemImage;
                        },
                    }}
                    label={itemLabel}
                >
                    {getLoadoutContents(loadoutItem)}
                </TreeItem>,
            );

            return <SimpleTreeView>{contents}</SimpleTreeView>;
        },
        [playerData, getItemDisplay, getLoadoutContents],
    );

    const favoriteItemsContent = useMemo(() => {
        if (!playerData?.favoriteItems?.length) {
            return '';
        }
        return [
            <h2 key="favorite-items-title">
                <Icon path={mdiTrophyAward} size={1.5} className="icon-with-text" />
                {t('Favorite Items')}
            </h2>,
            <ul key="favorite-items-content" className="favorite-item-list">
                {playerData.favoriteItems
                    .map((itemData) => {
                        if (itemData.parentId) {
                            return false;
                        }

                        let itemImage = undefined;
                        let itemLabel = '';
                        let itemDisplay = getItemDisplay(itemData);
                        if (itemDisplay) {
                            itemImage = itemDisplay.image;
                            itemLabel = itemDisplay.label;
                        }
                        return (
                            <li key={itemData._id}>
                                <SimpleTreeView>
                                    <TreeItem
                                        key={`loadout-item-${itemData._id}`}
                                        itemId={itemData._id}
                                        slots={{
                                            icon: () => {
                                                return itemImage;
                                            },
                                        }}
                                        label={itemLabel}
                                    >
                                        {getLoadoutContents(itemData, 'favorite')}
                                    </TreeItem>
                                </SimpleTreeView>
                            </li>
                        );
                    })
                    .filter(Boolean)}
            </ul>,
        ];
    }, [playerData, getItemDisplay, getLoadoutContents, t]);

    useEffect(() => {
        if (!turnstileToken) {
            return;
        }
        if (String(playerData.aid) === accountId) {
            return;
        }
        if (playerData.saved) {
            return;
        }
        fetchProfile();
    }, [playerData, accountId, turnstileToken, fetchProfile]);

    const playerSearchDiv = (
        <div>
            <p>
                <Link to={`/players?gameMode=${gameMode}`}>
                    <Icon path={mdiAccountSearch} size={1} className="icon-with-text" />
                    {t('Search different player')}
                </Link>
                <input
                    type="file"
                    id="file"
                    ref={inputFile}
                    style={{ display: 'none' }}
                    onChange={loadProfile}
                    accept="application/json,.json"
                />
                <Tippy content={t('Load profile from file')} placement="bottom">
                    <button
                        className="profile-button open"
                        onClick={() => {
                            inputFile.current?.click();
                        }}
                    >
                        <Icon path={mdiFolderOpen} size={1} className="icon-with-text" />
                    </button>
                </Tippy>
            </p>
        </div>
    );

    if (profileError) {
        return (
            <div className={'page-wrapper'} key="player-page-wrapper">
                <h2>{profileError}</h2>
                {playerSearchDiv}
            </div>
        );
    }

    return [
        <SEO
            title={`${t('Player Profile')} - ${t('Escape from Tarkov')} - ${t('Tarkov.dev')}`}
            description={t('player-page-description', 'View player profile.')}
            key="seo-wrapper"
        />,
        <div className={'page-wrapper'} key="player-page-wrapper">
            {playerSearchDiv}
            <div className="player-headline-wrapper" key="player-headline">
                <h1 className="player-page-title">
                    <Icon path={mdiAccountDetails} size={1.5} className="icon-with-text" />
                    {pageTitle}
                    {playerData.aid !== 0 && (
                        <span>
                            <Tippy content={t('Save profile')}>
                                <button
                                    className="profile-button download"
                                    onClick={downloadProfile}
                                >
                                    <Icon
                                        path={mdiDownloadBox}
                                        size={1}
                                        className="icon-with-text"
                                    />
                                </button>
                            </Tippy>
                        </span>
                    )}
                    {playerData.aid !== 0 && !playerData.saved && (
                        <span>
                            {typeof playerBanned === 'undefined' && (
                                <Tippy content={t('Check if player appears to be banned')}>
                                    <button
                                        ref={bannedButtonRef}
                                        className="profile-button banned-btn"
                                        onClick={() => {
                                            bannedButtonRef.current.disabled = true;
                                            checkBanned();
                                        }}
                                    >
                                        <Icon path={mdiGavel} size={1} className="icon-with-text" />
                                    </button>
                                </Tippy>
                            )}
                            {playerBanned === false && (
                                <span className="not-banned">{t('Not banned')}</span>
                            )}
                            {playerBanned === true && (
                                <span className="banned">{t('Possibly banned')}</span>
                            )}
                        </span>
                    )}
                </h1>
                {<Turnstile
                    ref={turnstileRef}
                    className="turnstile-widget"
                    siteKey="0x4AAAAAAAVVIHGZCr2PPwrR"
                    onSuccess={setTurnstileToken}
                    onError={(errorCode) => {
                        // https://developers.cloudflare.com/turnstile/reference/client-side-errors#error-codes
                        if (errorCode === '110200') {
                            setProfileError(
                                `Turnstile error: ${window.location.hostname} is not a valid hostname`,
                            );
                        } else {
                            setProfileError(`Turnstile error code ${errorCode}`);
                        }
                    }}
                    options={{ appearance: 'interaction-only' }}
                />}
            </div>
            <div>
                {accountCategories}
                {!!playerData.saved && (
                    <p className="banned">
                        {t('Warning: Profiles loaded from files may contain edited information')}
                    </p>
                )}
                {totalTimeInGame}
                {lastActiveDate}
                {raidsData?.length > 0 && (
                    <>
                        <h2 key="raids-title">
                            <Icon path={mdiChartLine} size={1.5} className="icon-with-text" />
                            {t('Raid Stats')}
                        </h2>
                        <DataTable key="raids-table" columns={raidsColumns} data={raidsData} />
                    </>
                )}
                {achievementsData?.length > 0 && (
                    <>
                        <h2 key="achievements-title">
                            <Icon path={mdiTrophy} size={1.5} className="icon-with-text" />
                            {t('Achievements')}
                        </h2>
                        <DataTable
                            key="achievements-table"
                            columns={achievementColumns}
                            data={achievementsData}
                            sortBy={'completionDate'}
                        />
                    </>
                )}
                {playerData.equipment?.Items?.length > 0 && (
                    <>
                        <h2>
                            <Icon path={mdiBagPersonal} size={1.5} className="icon-with-text" />
                            {t('Loadout')}
                        </h2>
                        <div className="inventory">
                            <div className="grid-container main">
                                <div className="earpiece">
                                    <div className="gear-slot-label">{'EARPIECE'}</div>
                                    {getLoadoutInSlot('Earpiece')}
                                </div>
                                <div className="headwear">
                                    <div className="gear-slot-label">{'HEADWEAR'}</div>
                                    {getLoadoutInSlot('Headwear')}
                                </div>
                                <div className="face_cover">
                                    <div className="gear-slot-label">{'FACE COVER'}</div>
                                    {getLoadoutInSlot('FaceCover')}
                                </div>
                                <div className="armband">
                                    <div className="gear-slot-label">{'ARMBAND'}</div>
                                    {getLoadoutInSlot('ArmBand')}
                                </div>
                                <div className="body_armor">
                                    <div className="gear-slot-label">{'BODY ARMOR'}</div>
                                    {getLoadoutInSlot('ArmorVest')}
                                </div>
                                <div className="eyewear">
                                    <div className="gear-slot-label">{'EYEWEAR'}</div>
                                    {getLoadoutInSlot('Eyewear')}
                                </div>
                                <div className="weapon on_sling">
                                    <div className="gear-slot-label">{'ON SLING'}</div>
                                    {getLoadoutInSlot('FirstPrimaryWeapon')}
                                </div>
                                <div className="holster">
                                    <div className="gear-slot-label">{'HOLSTER'}</div>
                                    {getLoadoutInSlot('Holster')}
                                </div>
                                <div className="weapon on_back">
                                    <div className="gear-slot-label">{'ON BACK'}</div>
                                    {getLoadoutInSlot('SecondPrimaryWeapon')}
                                </div>
                                <div className="sheath">
                                    <div className="gear-slot-label">{'SHEATH'}</div>
                                    {getLoadoutInSlot('Scabbard')}
                                </div>
                            </div>
                            <div className="grid-container side">
                                <div className="tactical_rig">
                                    <div className="gear-slot-label">{'TATICAL RIG'}</div>
                                    {getLoadoutInSlot('TacticalVest')}
                                </div>
                                <div className="pockets_and_special_slots">
                                    {getLoadoutInSlot('Pockets')}
                                </div>
                                <div className="backpack">
                                    <div className="gear-slot-label">{'BACKPACK'}</div>
                                    {getLoadoutInSlot('Backpack')}
                                </div>
                                <div className="pouch">
                                    <div className="gear-slot-label">{'POUCH'}</div>
                                    {getLoadoutInSlot('SecuredContainer')}
                                </div>
                            </div>
                        </div>
                    </>
                )}
                {favoriteItemsContent}
                {skillsData?.length > 0 && (
                    <>
                        <h2 key="skills-title">
                            <Icon path={mdiArmFlex} size={1.5} className="icon-with-text" />
                            {t('Skills')}
                        </h2>
                        <DataTable
                            key="skills-table"
                            columns={skillsColumns}
                            data={skillsData}
                            sortBy={'skill'}
                        />
                    </>
                )}
                {masteringData?.length > 0 && (
                    <>
                        <h2 key="mastering-title">
                            <Icon path={mdiStarBox} size={1.5} className="icon-with-text" />
                            {t('Mastering')}
                        </h2>
                        <DataTable
                            key="skills-table"
                            columns={masteringColumns}
                            data={masteringData}
                            sortBy={'Progress'}
                            sortByDesc={true}
                        />
                    </>
                )}
            </div>
        </div>,
    ];
}

export default Player;
