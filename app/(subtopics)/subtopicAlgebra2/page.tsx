'use client';

import Link from 'next/link';
import { useState } from 'react';
import { nanoid } from '@/lib/utils';
import { subtopicsAlgebra2 } from './subtopics';

const topics = [
    { id: nanoid(), name: 'Algebra 2', image: '/images/algebra2.png', color: 'bg-pink-100', progress: 22 }
];

export default function SubtopicAlgebra2Page() {
    const initialTopics = [
        { id: nanoid(), name: 'Algebra 1', link: '/subtopicAlgebra1' },
        { id: nanoid(), name: 'Geometry', link: '/subtopicGeometry' },
        { id: nanoid(), name: 'Algebra 2', link: '/subtopicAlgebra2' },
        { id: nanoid(), name: 'PreCalculus', link: '/subtopicPrecalculus' },
        { id: nanoid(), name: 'Calculus', link: '/subtopicCalculus' },
        { id: nanoid(), name: 'Statistics', link: '/subtopicStatistics' },
    ];

    const [savedTopics, setSavedTopics] = useState(initialTopics.map(topic => ({ ...topic, isFavorite: false })));
    const [initialOrder] = useState(savedTopics.map(topic => topic.id));
    const [subTopicsState, setSubTopicsState] = useState(subtopicsAlgebra2);

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

    const toggleSubtopicFavorite = (id: string) => {
        const updatedSubtopics = subTopicsState.map(subtopic => {
            if (subtopic.id === id) {
                return { ...subtopic, isFavorite: !subtopic.isFavorite };
            }
            return subtopic;
        });

        const sortedSubtopics = [...updatedSubtopics].sort((a, b) => {
            if (a.isFavorite !== b.isFavorite) {
                return a.isFavorite ? -1 : 1;
            }
            return subtopicsAlgebra2.findIndex(sub => sub.id === a.id) - subtopicsAlgebra2.findIndex(sub => sub.id === b.id);
        });

        setSubTopicsState(sortedSubtopics);
    };

    return (
        <div className="container mx-auto p-4 flex">
            {/* Left column for navigation */}
            <div className="w-1/8 pr-4 flex flex-col items-center">
                <Link href="/topics" legacyBehavior>
                    <a className="flex items-center justify-center w-12 h-12 bg-gray-500 rounded-lg mb-4">
                        <span className="text-2xl font-bold">+</span>
                    </a>
                </Link>
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

            {/* Right column for main content */}
            <div className="w-11/12">
                <div className="relative">
                    <div
                        className="relative p-4 rounded-lg flex flex-col justify-end cursor-default"
                        style={{
                            backgroundImage: `url(${topics[0].image})`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            height: '200px'
                        }}
                    >
                        <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 p-2 rounded-b-lg">
                            <h2 className="text-4xl font-semibold text-white">{topics[0].name}</h2>
                            <div className="bg-white text-black rounded-lg px-2 py-1 text-xs inline-block mt-2">
                                ★ Beginner / Intermediate / Advanced / Proficient / Not started
                            </div>
                        </div>
                        <div className="absolute top-2 right-2 bg-purple-600 text-white rounded-full px-2 py-1 text-xs">
                            {topics[0].progress}%
                        </div>
                    </div>
                </div>
                <div className="mt-8">
                    <div className="mt-2">
                        {subTopicsState.map((subtopic) => (
                            <div
                                key={subtopic.id}
                                className="flex items-center justify-between p-4 border-b"
                            >
                                <div className="flex items-center">
                                    <div className="ml-2">
                                        <h3 className="text-lg font-semibold">{subtopic.name}</h3>
                                        <p className="text-sm text-gray-500">{subtopic.status}</p>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-4">
                                    {subtopic.progress > 0 && (
                                        <div className="bg-purple-600 text-white rounded-full px-2 py-1 text-xs">
                                            {subtopic.progress}%
                                        </div>
                                    )}
                                    <span
                                        className={`icon-star text-xl cursor-pointer ${subtopic.isFavorite ? 'text-yellow-500' : 'text-gray-500'}`}
                                        onClick={() => toggleSubtopicFavorite(subtopic.id)}
                                    >
                                        {subtopic.isFavorite ? '★' : '☆'}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
