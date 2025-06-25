import React from 'react'

const page = () => {
  return (
    <div>page wip</div>
  )
}

export default page

/* 'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { nanoid } from '@/lib/utils';
import { subtopicsAlgebra1 } from '@/app/subtopics/subtopicAlgebra1/subtopics';
import { subtopicsGeometry } from '@/app/subtopicGeometry/subtopics';
import { subtopicsAlgebra2 } from '@/app/subtopicAlgebra2/subtopics';
import { subtopicsPrecalculus } from '@/app/subtopicPrecalculus/subtopics';
import { subtopicsCalculus } from '@/app/subtopicCalculus/subtopics';
import { subtopicsStatistics } from '@/app/subtopicStatistics/subtopics';

const topics = [
    { id: nanoid(), name: 'Algebra 1', image: '/images/algebra1.png', color: 'bg-pink-100', link: '/subtopicAlgebra1' },
    { id: nanoid(), name: 'Geometry', image: '/images/geometry.png', color: 'bg-green-100', link: '/subtopicGeometry' },
    { id: nanoid(), name: 'Algebra 2', image: '/images/algebra2.png', color: 'bg-blue-100', link: '/subtopicAlgebra2' },
    { id: nanoid(), name: 'PreCalculus', image: '/images/precalculus.png', color: 'bg-yellow-100', link: '/subtopicPrecalculus' },
    { id: nanoid(), name: 'Calculus', image: '/images/calculus.png', color: 'bg-red-100', link: '/subtopicCalculus' },
    { id: nanoid(), name: 'Statistics', image: '/images/statistics.png', color: 'bg-purple-100', link: '/subtopicStatistics' },
];

const allSubtopics = [
    ...subtopicsAlgebra1,
    ...subtopicsGeometry,
    ...subtopicsAlgebra2,
    ...subtopicsPrecalculus,
    ...subtopicsCalculus,
    ...subtopicsStatistics,
];

const suggestedTopics = [
    { id: nanoid(), name: 'Algebra 1', status: 'Continue learning' },
    { id: nanoid(), name: 'Algebra 2', status: 'Not started' },
];

export default function TopicsPage() {
    const initialTopics = [
        { id: nanoid(), name: 'Algebra 1', link: '/subtopicAlgebra1' },
        { id: nanoid(), name: 'Geometry', link: '/subtopicGeometry' },
        { id: nanoid(), name: 'Algebra 2', link: '/subtopicAlgebra2' },
        { id: nanoid(), name: 'PreCalculus', link: '/subtopicPrecalculus' },
        { id: nanoid(), name: 'Calculus', link: '/subtopicCalculus' },
        { id: nanoid(), name: 'Statistics', link: '/subtopicStatistics' },
    ];

    const [savedTopics, setSavedTopics] = useState(initialTopics.map((topic: any) => ({ ...topic, isFavorite: false })));
    const [initialOrder] = useState(savedTopics.map((topic: any) => topic.id));
    const [showSuggested, setShowSuggested] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filteredResults, setFilteredResults] = useState<any[]>([]);

    useEffect(() => {
        if (searchQuery.trim() === '') {
            setFilteredResults([]);
            return;
        }
        const filteredSubtopics = allSubtopics.filter(subtopic =>
            subtopic.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
        setFilteredResults(filteredSubtopics);
    }, [searchQuery]);
    
    const toggleFavorite = (id: string) => {
        const updatedTopics = savedTopics.map(topic => {
            if (topic.id === id) {
                return { ...topic, isFavorite: !topic.isFavorite };
            }
            return topic;
        });

        const sortedTopics = [...updatedTopics].sort((a, b) => {
            if (a.isFavorite && !b.isFavorite) {
                return -1;
            }
            if (!a.isFavorite && b.isFavorite) {
                return 1;
            }
            return initialOrder.indexOf(a.id) - initialOrder.indexOf(b.id);
        });

        setSavedTopics(sortedTopics);
    };

    const toggleSuggested = () => {
        setShowSuggested(!showSuggested);
    };

    return (
        <div className="container mx-auto p-4 flex">
            { Left column for saved topics }
            <div className="w-1/8 pr-4 flex flex-col items-center">
                <div className="flex flex-col items-center space-y-4">
                    <h2 className="text-lg font-bold mb-4">Saved<br />Topics</h2>
                    <ul className="space-y-4">
                        {savedTopics.map((topic) => (
                            <li key={topic.id} className="flex flex-col items-center">
                                <div
                                    className="flex flex-col items-center bg-gray-200 p-2 rounded-lg cursor-pointer"
                                    onClick={() => toggleFavorite(topic.id)}
                                >
                                    <span className={`inline-flex items-center justify-center w-12 h-6 bg-gray-500 rounded-full ${topic.isFavorite ? 'text-white-500' : 'text-white-500'}`}>
                                        {topic.isFavorite ? '★' : '☆'}
                                    </span>
                                </div>
                                <Link href={topic.link} legacyBehavior>
                                    <a className="text-white-500 hover:underline">{topic.name}</a>
                                </Link>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            { Right column for main content }
            <div className="w-11/12">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold">Topics</h1>
                </div>
                <div className="mt-4 relative flex items-center">
                    <div className="mr-2 cursor-pointer" onClick={() => console.log('Microphone clicked')}>
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            height="16"
                            viewBox="0 0 16 16"
                            width="16"
                            style={{ color: 'currentcolor' }}
                        >
                            <path
                                fillRule="evenodd"
                                clipRule="evenodd"
                                d="M8.50098 1.5H7.50098C6.67255 1.5 6.00098 2.17157 6.00098 3V7C6.00098 7.82843 6.67255 8.5 7.50098 8.5H8.50098C9.32941 8.5 10.001 7.82843 10.001 7V3C10.001 2.17157 9.32941 1.5 8.50098 1.5ZM7.50098 0C5.84412 0 4.50098 1.34315 4.50098 3V7C4.50098 8.65685 5.84412 10 7.50098 10H8.50098C10.1578 10 11.501 8.65685 11.501 7V3C11.501 1.34315 10.1578 0 8.50098 0H7.50098ZM7.25098 13.2088V15.25V16H8.75098V15.25V13.2088C11.5607 12.8983 13.8494 10.8635 14.5383 8.18694L14.7252 7.46062L13.2726 7.08673L13.0856 7.81306C12.5028 10.0776 10.4462 11.75 8.00098 11.75C5.55572 11.75 3.49918 10.0776 2.91633 7.81306L2.72939 7.08673L1.27673 7.46062L1.46368 8.18694C2.15258 10.8635 4.44128 12.8983 7.25098 13.2088Z"
                                fill="currentColor"
                            />
                        </svg>
                    </div>
                    <input
                        type="text"
                        placeholder="Search for a subtopic"
                        className="input input-bordered w-full rounded-lg py-3 px-4 text-black placeholder-black bg-gray-300 border-gray-600"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    {filteredResults.length > 0 && (
                        <div className="absolute top-full left-0 right-0 bg-white border border-gray-300 rounded-lg mt-1 max-h-60 overflow-y-auto z-10">
                            <ul className="divide-y divide-gray-200">
                                {filteredResults.map((subtopic) => (
                                    <li key={subtopic.id} className="p-2 hover:bg-gray-100 cursor-pointer">
                                        <Link href={subtopic.link} legacyBehavior>
                                            <a>{subtopic.name}</a>
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
                <div className="overflow-x-auto mt-4">
                    <div className="flex space-x-4" style={{ minWidth: '100%' }}>
                        {topics.map((topic) => (
                            <Link key={topic.id} href={topic.link} legacyBehavior>
                                <a className="flex-shrink-0" style={{ flex: '0 0 33.33%' }}>
                                    <div
                                        className="relative p-4 rounded-lg flex flex-col items-center justify-end cursor-pointer"
                                        style={{
                                            backgroundImage: `url(${topic.image})`,
                                            backgroundSize: 'cover',
                                            backgroundPosition: 'center',
                                            height: '200px'
                                        }}
                                    >
                                        <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 p-2 rounded-b-lg">
                                            <h2 className="text-lg font-semibold text-white text-center">{topic.name}</h2>
                                        </div>
                                    </div>
                                </a>
                            </Link>
                        ))}
                    </div>
                </div>
                <div className="mt-8">
                    <h2 className="text-base font flex items-center cursor-pointer" onClick={toggleSuggested}>
                        <span className="mr-2">{showSuggested ? '▼' : '►'}</span> Suggested
                    </h2>
                    {showSuggested && (
                        <div className="mt-2">
                            {suggestedTopics.map((topic) => (
                                <div
                                    key={topic.id}
                                    className="flex items-center justify-between p-4 border-b"
                                >
                                    <div className="flex items-center">
                                        <div className="ml-2">
                                            <h3 className="text-lg font-semibold">{topic.name}</h3>
                                            <p className="text-sm text-gray-500">{topic.status}</p>
                                        </div>
                                    </div>
                                    <button className="btn btn-primary">Start</button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
} */