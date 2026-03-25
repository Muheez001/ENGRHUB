// Firestore Seed Data — ECE Department at LASU
// This is the initial data structure for Electronics & Computer Engineering
// Run this script once to populate the starting department data

import { db } from '../config/firebase';
import {
    doc,
    setDoc,
    collection,
    writeBatch,
} from 'firebase/firestore';

const ECE_DEPT = {
    id: 'ece',
    name: 'Electronics & Computer Engineering',
    code: 'ECE',
    totalYears: 5,
    active: true,
};

const ECE_YEARS = [
    {
        yearId: 'year1',
        yearNumber: 1,
        label: '100 Level',
        nigerianLevel: '100L',
        corenRef: 'COREN/ECE/100L',
        worldRef: 'MIT/6-1/Year1',
    },
    {
        yearId: 'year2',
        yearNumber: 2,
        label: '200 Level',
        nigerianLevel: '200L',
        corenRef: 'COREN/ECE/200L',
        worldRef: 'MIT/6-1/Year2',
    },
    {
        yearId: 'year3',
        yearNumber: 3,
        label: '300 Level',
        nigerianLevel: '300L',
        corenRef: 'COREN/ECE/300L',
        worldRef: 'MIT/6-1/Year3',
    },
    {
        yearId: 'year4',
        yearNumber: 4,
        label: '400 Level',
        nigerianLevel: '400L',
        corenRef: 'COREN/ECE/400L',
        worldRef: 'MIT/6-1/Year4',
    },
    {
        yearId: 'year5',
        yearNumber: 5,
        label: '500 Level',
        nigerianLevel: '500L',
        corenRef: 'COREN/ECE/500L',
        worldRef: 'MIT/6-1/Year5',
    },
];

// Sample sessions for Year 1 (100L)
const YEAR1_SESSIONS = [
    {
        sessionId: '100L-first',
        creditUnits: 24,
        requiredCourses: [], // Will be populated when courses are ingested
    },
    {
        sessionId: '100L-second',
        creditUnits: 22,
        requiredCourses: [],
    },
];

// Sample courses for Year 1 — these represent typical 100L ECE courses at LASU
const SAMPLE_COURSES = [
    {
        courseId: 'ece-100l-mat101',
        code: 'MAT 101',
        title: 'Elementary Mathematics I',
        deptId: 'ece',
        yearNumber: 1,
        session: '100L-first',
        creditUnits: 4,
        mitEquivalent: '18.01',
        gapScore: null,
        youtubePlaylist: null,
    },
    {
        courseId: 'ece-100l-phy101',
        code: 'PHY 101',
        title: 'General Physics I (Mechanics)',
        deptId: 'ece',
        yearNumber: 1,
        session: '100L-first',
        creditUnits: 4,
        mitEquivalent: '8.01',
        gapScore: null,
        youtubePlaylist: null,
    },
    {
        courseId: 'ece-100l-che101',
        code: 'CHE 101',
        title: 'General Chemistry I',
        deptId: 'ece',
        yearNumber: 1,
        session: '100L-first',
        creditUnits: 3,
        mitEquivalent: '5.111',
        gapScore: null,
        youtubePlaylist: null,
    },
    {
        courseId: 'ece-100l-eng101',
        code: 'ENG 101',
        title: 'Workshop Practice I',
        deptId: 'ece',
        yearNumber: 1,
        session: '100L-first',
        creditUnits: 2,
        mitEquivalent: null,
        gapScore: null,
        youtubePlaylist: null,
    },
    {
        courseId: 'ece-100l-gns101',
        code: 'GNS 101',
        title: 'Use of English I',
        deptId: 'ece',
        yearNumber: 1,
        session: '100L-first',
        creditUnits: 2,
        mitEquivalent: null,
        gapScore: null,
        youtubePlaylist: null,
    },
];

export async function seedDatabase() {
    try {
        const batch = writeBatch(db);

        // 1. Seed ECE department
        const deptRef = doc(db, 'departments', ECE_DEPT.id);
        batch.set(deptRef, ECE_DEPT);

        // 2. Seed years (100L - 500L)
        for (const year of ECE_YEARS) {
            const yearRef = doc(db, 'departments', 'ece', 'years', year.yearId);
            batch.set(yearRef, {
                yearNumber: year.yearNumber,
                label: year.label,
                nigerianLevel: year.nigerianLevel,
                corenRef: year.corenRef,
                worldRef: year.worldRef,
            });
        }

        // 3. Seed Year 1 sessions
        for (const session of YEAR1_SESSIONS) {
            const sessionRef = doc(
                db,
                'departments',
                'ece',
                'years',
                'year1',
                'sessions',
                session.sessionId
            );
            batch.set(sessionRef, session);
        }

        // 4. Seed sample courses
        for (const course of SAMPLE_COURSES) {
            const courseRef = doc(db, 'courses', course.courseId);
            batch.set(courseRef, course);
        }

        await batch.commit();
        console.log('✅ Database seeded successfully with ECE department data');
        return true;
    } catch (error) {
        console.error('❌ Failed to seed database:', error);
        return false;
    }
}

export { ECE_DEPT, ECE_YEARS, YEAR1_SESSIONS, SAMPLE_COURSES };
