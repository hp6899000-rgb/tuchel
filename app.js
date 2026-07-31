

        import { initializeApp } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js";
        import {
            getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut,
            onAuthStateChanged, updateProfile,
            GoogleAuthProvider, signInWithPopup,
            setPersistence, browserSessionPersistence
        } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";
        import {
            getFirestore, collection, doc, setDoc, getDoc, getDocs, updateDoc, deleteDoc, addDoc,
            query, where, orderBy, onSnapshot, serverTimestamp, arrayUnion, increment, limit, limitToLast, startAfter
        } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

        const firebaseConfig = {
            apiKey: "AIzaSyCAKCZJTAq_NeLmo5toNjYVHFqZFSQxNzE",
            authDomain: "tuchel-98f49.firebaseapp.com",
            projectId: "tuchel-98f49",
            storageBucket: "tuchel-98f49.firebasestorage.app",
            messagingSenderId: "150337843790",
            appId: "1:150337843790:web:ae748271b1ffae423f491f",
            measurementId: "G-NZMF0WDKVK"
        };

        const app = initializeApp(firebaseConfig);
        const auth = getAuth(app);
        try{await setPersistence(auth, browserSessionPersistence);}catch(e){console.warn("Auth persistence:",e.message);}
        const db = getFirestore(app);
        const googleProvider = new GoogleAuthProvider();
        const UPLOADCARE_PUBLIC_KEY = "a86c7a60e542a9af46c4";

        let currentUser = null;
        let currentUserData = null;
        let allJobs = [];
        let usingFallbackJobs = true;
        let allApps = [];
        let allFees = [];
        let allChats = [];
        let unsubscribeApps = null;
        let unsubscribeJobs = null;
        let unsubscribeFees = null;
        let unsubscribeChats = null;
        let unsubscribeMessages = null;
        let viewportCleanup = null;
        let cachedAdminUids = null;
        let olderMessages = [];
        let msgEarliestTimestamp = null;
        let msgHasMore = false;
        const PAGE_SIZE = 200;
        let chatWindowOpen = null;

        const COUNTRIES = [
            "Germany", "United Kingdom", "Netherlands", "Sweden",
            "Ireland", "Luxembourg", "France", "Poland"
        ];
        const COUNTRY_META = {
            "Germany": { flag: "de", dial: "+49", currency: "EUR" },
            "United Kingdom": { flag: "gb", dial: "+44", currency: "GBP" },
            "Netherlands": { flag: "nl", dial: "+31", currency: "EUR" },
            "Sweden": { flag: "se", dial: "+46", currency: "SEK" },
            "Ireland": { flag: "ie", dial: "+353", currency: "EUR" },
            "Luxembourg": { flag: "lu", dial: "+352", currency: "EUR" },
            "France": { flag: "fr", dial: "+33", currency: "EUR" },
            "Poland": { flag: "pl", dial: "+48", currency: "PLN" }
        };
        const COUNTRY_DETAILS = {
            "Germany": {
                overview: "Germany combines strong worker protections with a robust economy and excellent work-life balance. Employees enjoy comprehensive social security, generous leave, and extensive contractual benefits.",
                facts: "~45M employed | Kindergeld €250/child/mo | Dual vocational training | Strong collective bargaining",
                employeeCount: "~45 million",
                minWage: "€12.41/hr",
                currency: "EUR",
                benefits: [
                    { icon: "calendar-check", label: "Paid Leave", value: "28–30 days/year" },
                    { icon: "gavel", label: "Public Holidays", value: "9–13 days/year" },
                    { icon: "heart-pulse", label: "Health Insurance", value: "Mandatory public/private coverage" },
                    { icon: "baby", label: "Parental Leave", value: "14 wks full maternity + 14 months parental leave" },
                    { icon: "clock", label: "Work Hours", value: "35–40 hrs/week" },
                    { icon: "shield", label: "Social Security", value: "Pension + unemployment + care insurance" },
                    { icon: "graduation-cap", label: "Education Support", value: "Up to €500/yr professional development" },
                    { icon: "bus", label: "Transport", value: "Jobticket subsidy, often employer-paid" },
                    { icon: "wifi", label: "WiFi & Perks", value: "Company pension scheme, team events, gym discounts" },
                    { icon: "utensils", label: "Meals", value: "Subsidized canteen at most companies" },
                    { icon: "gamepad", label: "Social", value: "Firmenevents, sports groups, after-work" },
                    { icon: "house-chimney", label: "Relocation", value: "Visa support + initial accommodation help" }
                ]
            },
            "United Kingdom": {
                overview: "The UK offers a flexible labour market with strong employment rights, a world-class healthcare system (NHS), and diverse job opportunities across multiple industries.",
                facts: "~33M employed | Minimum wage £11.44/hr (2024) | Auto-enrolment pension | Strong startup scene",
                employeeCount: "~33 million",
                minWage: "£11.44/hr",
                currency: "GBP",
                benefits: [
                    { icon: "calendar-check", label: "Paid Leave", value: "28 days/year (incl. bank holidays)" },
                    { icon: "gavel", label: "Public Holidays", value: "8 days/year" },
                    { icon: "heart-pulse", label: "Health Insurance", value: "NHS (free at point of use)" },
                    { icon: "baby", label: "Parental Leave", value: "52 wks maternity (39 wks paid)" },
                    { icon: "clock", label: "Work Hours", value: "37.5–40 hrs/week" },
                    { icon: "shield", label: "Social Security", value: "National Insurance + workplace pension" },
                    { icon: "graduation-cap", label: "Education Support", value: "Many firms offer L&D budget £500-2000/yr" },
                    { icon: "bicycle", label: "Transport", value: "Cycle to Work scheme + rail season loan" },
                    { icon: "wifi", label: "WiFi & Perks", value: "Hybrid working, gym membership, private medical" },
                    { icon: "utensils", label: "Meals", value: "Many offices provide free snacks/drinks" },
                    { icon: "gamepad", label: "Social", value: "Team outings, pub nights, quarterly events" },
                    { icon: "house-chimney", label: "Relocation", value: "Some employers offer relocation allowance" }
                ]
            },
            "Netherlands": {
                overview: "The Netherlands is known for excellent work-life balance, a highly educated workforce, favourable tax treatment for expats, and progressive labour policies.",
                facts: "~9.5M employed | 30% tax ruling for expats | 13th month common | Best work-life balance globally",
                employeeCount: "~9.5 million",
                minWage: "€13.27/hr",
                currency: "EUR",
                benefits: [
                    { icon: "calendar-check", label: "Paid Leave", value: "20–25 days/year + 13th month possible" },
                    { icon: "gavel", label: "Public Holidays", value: "8–10 days/year" },
                    { icon: "heart-pulse", label: "Health Insurance", value: "Mandatory private (€150-200/mo)" },
                    { icon: "baby", label: "Parental Leave", value: "16 wks maternity + 9 wks partner leave" },
                    { icon: "clock", label: "Work Hours", value: "36–40 hrs/week (4-day week common)" },
                    { icon: "tent", label: "Probation", value: "2 months (max)" },
                    { icon: "shield", label: "Social Security", value: "AOW pension + unemployment + disability" },
                    { icon: "graduation-cap", label: "Education Support", value: "Study budget, conferences, courses" },
                    { icon: "bicycle", label: "Transport", value: "Bike scheme + public transport fully covered" },
                    { icon: "wifi", label: "WiFi & Perks", value: "Home office budget, internet allowance" },
                    { icon: "utensils", label: "Meals", value: "Subsidized lunch, daily team lunch culture" },
                    { icon: "house-chimney", label: "Relocation", value: "30% tax ruling + moving cost compensation" }
                ]
            },
            "Sweden": {
                overview: "Sweden offers one of the world's most generous parental leave systems, strong collective agreements, a collaborative work culture with daily fika breaks, and high living standards.",
                facts: "~5.2M employed | 480 days parental leave | Fika daily break culture | Strong unions",
                employeeCount: "~5.2 million",
                minWage: "Set by collective agreements (~SEK 150-170/hr)",
                currency: "SEK",
                benefits: [
                    { icon: "calendar-check", label: "Paid Leave", value: "25 days/year" },
                    { icon: "gavel", label: "Public Holidays", value: "11 days/year" },
                    { icon: "heart-pulse", label: "Health Insurance", value: "Low-cost universal healthcare" },
                    { icon: "baby", label: "Parental Leave", value: "480 days (390 at 80% pay)" },
                    { icon: "clock", label: "Work Hours", value: "40 hrs/week (6-hr day experimented)" },
                    { icon: "tent", label: "Probation", value: "Up to 6 months" },
                    { icon: "shield", label: "Social Security", value: "Pension + parental + sickness benefits" },
                    { icon: "graduation-cap", label: "Education Support", value: "Generous study leave + tuition aid" },
                    { icon: "dumbbell", label: "Wellness", value: "Friskvårdsbidrag (wellness grant) ~SEK 3000/yr" },
                    { icon: "mug-saucer", label: "Culture", value: "Daily fika break (coffee + social)" },
                    { icon: "gamepad", label: "Social", value: "After-work events, kick-offs, team days" },
                    { icon: "house-chimney", label: "Relocation", value: "Employer handles work permit + housing search" }
                ]
            },
            "Ireland": {
                overview: "Ireland boasts a dynamic economy with major multinational employers, a competitive tax regime, and a warm culture. English-speaking with strong worker protections and growing minimum wage.",
                facts: "~2.6M employed | Min wage €12.70/hr | 10 public holidays | Multinational hub",
                employeeCount: "~2.6 million",
                minWage: "€12.70/hr",
                currency: "EUR",
                benefits: [
                    { icon: "calendar-check", label: "Paid Leave", value: "20 days/year (min)" },
                    { icon: "gavel", label: "Public Holidays", value: "10 days/year" },
                    { icon: "heart-pulse", label: "Health Insurance", value: "Public healthcare + optional private" },
                    { icon: "baby", label: "Parental Leave", value: "26 wks maternity + 2 wks paternity" },
                    { icon: "clock", label: "Work Hours", value: "39 hrs/week" },
                    { icon: "tent", label: "Probation", value: "Up to 6 months" },
                    { icon: "shield", label: "Social Security", value: "PRSI (pension + benefits)" },
                    { icon: "graduation-cap", label: "Education Support", value: "Tuition reimbursement common" },
                    { icon: "bus", label: "Transport", value: "TaxSaver commuter tickets" },
                    { icon: "wifi", label: "WiFi & Perks", value: "Flexible/remote work, bike-to-work scheme" },
                    { icon: "utensils", label: "Meals", value: "Many offices provide lunch/snacks" },
                    { icon: "house-chimney", label: "Relocation", value: "Visa sponsorship + relocation package typical" }
                ]
            },
            "Luxembourg": {
                overview: "Luxembourg offers the highest minimum wage in the EU, a very generous social security system, high salaries across all sectors, and a truly international work environment.",
                facts: "~500K employed | Highest EU min wage (€15.86 skilled) | Free public transport | 13th month common",
                employeeCount: "~500,000",
                minWage: "€15.86/hr (skilled)",
                currency: "EUR",
                benefits: [
                    { icon: "calendar-check", label: "Paid Leave", value: "26 days/year" },
                    { icon: "gavel", label: "Public Holidays", value: "11 days/year" },
                    { icon: "heart-pulse", label: "Health Insurance", value: "Sécurité Sociale (excellent coverage)" },
                    { icon: "baby", label: "Parental Leave", value: "16 wks full maternity + parental leave" },
                    { icon: "clock", label: "Work Hours", value: "38–40 hrs/week" },
                    { icon: "coins", label: "13th Month", value: "Common (often mandatory)" },
                    { icon: "shield", label: "Social Security", value: "Comprehensive (pension + health + unemployment)" },
                    { icon: "graduation-cap", label: "Education Support", value: "Congé individuel de formation (training leave)" },
                    { icon: "train", label: "Transport", value: "Free nationwide public transport" },
                    { icon: "wifi", label: "WiFi & Perks", value: "Meal vouchers (€15/day), company car common" },
                    { icon: "utensils", label: "Meals", value: "Meal vouchers or subsidized canteen" },
                    { icon: "house-chimney", label: "Relocation", value: "Accommodation support + expat-friendly" }
                ]
            },
            "France": {
                overview: "France has a strong labour code with excellent social protections, the 35-hour work week, extensive leave policies, and a rich culture of employee benefits including profit-sharing.",
                facts: "~30M employed | 35-hr work week | 5+ weeks leave + RTT | Profit-sharing (intéressement)",
                employeeCount: "~30 million",
                minWage: "€11.65/hr (SMIC)",
                currency: "EUR",
                benefits: [
                    { icon: "calendar-check", label: "Paid Leave", value: "25 days + RTT (up to 12 more)" },
                    { icon: "gavel", label: "Public Holidays", value: "11 days/year" },
                    { icon: "heart-pulse", label: "Health Insurance", value: "Sécurité Sociale + mutuelle (top-up)" },
                    { icon: "baby", label: "Parental Leave", value: "16 wks full maternity + 25 days paternity" },
                    { icon: "clock", label: "Work Hours", value: "35 hrs/week (legal max)" },
                    { icon: "coins", label: "13th Month", value: "Common in many sectors" },
                    { icon: "shield", label: "Social Security", value: "Extensive (health + pension + family + unemployment)" },
                    { icon: "graduation-cap", label: "Education Support", value: "Compte Personnel de Formation (training credits)" },
                    { icon: "bus", label: "Transport", value: "50% of public transport paid by employer" },
                    { icon: "utensils", label: "Meals", value: "Tickets restaurant (meal vouchers) ~€10-12/day" },
                    { icon: "gamepad", label: "Culture", value: "After-work, team building, comité d'entreprise" },
                    { icon: "house-chimney", label: "Relocation", value: "Visa assistance + integration support" }
                ]
            },
            "Poland": {
                overview: "Poland is a rapidly growing economy with competitive labour costs, improving social benefits, a skilled workforce, and increasing foreign investment driving demand for international talent.",
                facts: "~17M employed | Fastest-growing EU economy | PPK pension system | Strong IT/engineering sector",
                employeeCount: "~17 million",
                minWage: "4242 PLN/mo (2024)",
                currency: "PLN",
                benefits: [
                    { icon: "calendar-check", label: "Paid Leave", value: "20–26 days/year (based on experience)" },
                    { icon: "gavel", label: "Public Holidays", value: "13 days/year" },
                    { icon: "heart-pulse", label: "Health Insurance", value: "NFZ public healthcare" },
                    { icon: "baby", label: "Parental Leave", value: "20 wks maternity + 41 wks parental" },
                    { icon: "clock", label: "Work Hours", value: "40 hrs/week" },
                    { icon: "tent", label: "Probation", value: "3 months (max)" },
                    { icon: "shield", label: "Social Security", value: "ZUS (pension + disability + health)" },
                    { icon: "graduation-cap", label: "Education Support", value: "Language courses, certifications funded" },
                    { icon: "bus", label: "Transport", value: "Partial commuting subsidy common" },
                    { icon: "wifi", label: "WiFi & Perks", value: "Private medical (Medicover/Lux Med), Multisport card" },
                    { icon: "utensils", label: "Meals", value: "Lunch card/subsidy common in cities" },
                    { icon: "gamepad", label: "Culture", value: "Team integration events, holiday bonuses" }
                ]
            }
        };
        const CATEGORIES = [
            "Healthcare", "Security & Safety", "Logistics & Warehousing",
            "Construction & Manual Labor", "Cleaning & Maintenance",
            "Health, Safety & Environment", "Hospitality & Tourism",
            "Agriculture & Farming", "Driving"
        ];
        const CATEGORY_ICON = {
            "Healthcare": "fa-solid fa-notes-medical",
            "Security & Safety": "fa-solid fa-shield-halved",
            "Logistics & Warehousing": "fa-solid fa-warehouse",
            "Construction & Manual Labor": "fa-solid fa-helmet-safety",
            "Cleaning & Maintenance": "fa-solid fa-broom",
            "Health, Safety & Environment": "fa-solid fa-leaf",
            "Hospitality & Tourism": "fa-solid fa-concierge-bell",
            "Agriculture & Farming": "fa-solid fa-wheat-awn",
            "Driving": "fa-solid fa-truck"
        };
        const STATUS_STEPS = [
            "Application Received",
            "Documents Processing (Work Permit, Standard Europe Pass CV / Cover Letter)",
            "Documents Review & Approval",
            "Employer Matching & Interview",
            "Job Offer & Contract Signing",
            "Visa Sponsorship Processing",
            "Medical & Police Clearance",
            "Travel & Deployment",
            "Placed — Active Employment"
        ];
        const TERMINAL_ALT = ["On Hold", "Rejected", "Withdrawn by Applicant"];
        const ALL_STATUSES = [...STATUS_STEPS, ...TERMINAL_ALT];
        const SERVICE_TYPES = [
            { id:'visa_application', label:'Visa Application Processing', icon:'fa-passport', color:'var(--blue-600)' },
            { id:'air_ticket', label:'Air Ticket Booking', icon:'fa-plane', color:'var(--emerald-600)' },
            { id:'hotel_booking', label:'Hotel Booking', icon:'fa-hotel', color:'var(--amber-600)' },
            { id:'airport_pickup', label:'Airport Pickup', icon:'fa-taxi', color:'var(--maroon-600)' },
            { id:'bank_account', label:'Bank Account Setup', icon:'fa-building-columns', color:'var(--slate-600)' },
            { id:'orientation', label:'Orientation & Settling In', icon:'fa-compass', color:'var(--blue-600)' },
            { id:'legal_assistance', label:'Legal / Permit Assistance', icon:'fa-gavel', color:'var(--maroon-500)' },
            { id:'accommodation', label:'Accommodation Arrangement', icon:'fa-house', color:'var(--emerald-600)' },
            { id:'insurance', label:'Health Insurance Setup', icon:'fa-shield', color:'var(--blue-700)' },
            { id:'other', label:'Other Assistance Service', icon:'fa-handshake', color:'var(--slate-500)' }
        ];
        const FLAG_BASE = "https://flagcdn.com/";
        const EDUCATION_LEVELS = [
            "High School / Secondary", "Diploma / Certificate", "Bachelor's Degree",
            "Master's Degree", "PhD / Doctorate", "Vocational / Trade", "Other"
        ];
        const NATIONALITIES = [
            { name: "Kenya", code: "KE", dial: "+254", flag: "ke" },
            { name: "Nigeria", code: "NG", dial: "+234", flag: "ng" },
            { name: "Ghana", code: "GH", dial: "+233", flag: "gh" },
            { name: "South Africa", code: "ZA", dial: "+27", flag: "za" },
            { name: "Uganda", code: "UG", dial: "+256", flag: "ug" },
            { name: "Tanzania", code: "TZ", dial: "+255", flag: "tz" },
            { name: "Ethiopia", code: "ET", dial: "+251", flag: "et" },
            { name: "India", code: "IN", dial: "+91", flag: "in" },
            { name: "Philippines", code: "PH", dial: "+63", flag: "ph" },
            { name: "Bangladesh", code: "BD", dial: "+880", flag: "bd" },
            { name: "Pakistan", code: "PK", dial: "+92", flag: "pk" },
            { name: "Nepal", code: "NP", dial: "+977", flag: "np" },
            { name: "Sri Lanka", code: "LK", dial: "+94", flag: "lk" },
            { name: "Cameroon", code: "CM", dial: "+237", flag: "cm" },
            { name: "Cote d'Ivoire", code: "CI", dial: "+225", flag: "ci" },
            { name: "Senegal", code: "SN", dial: "+221", flag: "sn" },
            { name: "Morocco", code: "MA", dial: "+212", flag: "ma" },
            { name: "Egypt", code: "EG", dial: "+20", flag: "eg" },
            { name: "Zimbabwe", code: "ZW", dial: "+263", flag: "zw" },
            { name: "Zambia", code: "ZM", dial: "+260", flag: "zm" },
            { name: "Rwanda", code: "RW", dial: "+250", flag: "rw" },
            { name: "Somalia", code: "SO", dial: "+252", flag: "so" },
            { name: "Sudan", code: "SD", dial: "+249", flag: "sd" },
            { name: "Liberia", code: "LR", dial: "+231", flag: "lr" },
            { name: "Sierra Leone", code: "SL", dial: "+232", flag: "sl" },
            { name: "Gambia", code: "GM", dial: "+220", flag: "gm" },
            { name: "Botswana", code: "BW", dial: "+267", flag: "bw" },
            { name: "Malawi", code: "MW", dial: "+265", flag: "mw" },
            { name: "Mozambique", code: "MZ", dial: "+258", flag: "mz" },
            { name: "Angola", code: "AO", dial: "+244", flag: "ao" },
            { name: "DR Congo", code: "CD", dial: "+243", flag: "cd" },
            { name: "Benin", code: "BJ", dial: "+229", flag: "bj" },
            { name: "Burkina Faso", code: "BF", dial: "+226", flag: "bf" },
            { name: "Mali", code: "ML", dial: "+223", flag: "ml" },
            { name: "Niger", code: "NE", dial: "+227", flag: "ne" },
            { name: "Togo", code: "TG", dial: "+228", flag: "tg" },
            { name: "Chad", code: "TD", dial: "+235", flag: "td" },
            { name: "Mauritius", code: "MU", dial: "+230", flag: "mu" },
            { name: "Seychelles", code: "SC", dial: "+248", flag: "sc" },
            { name: "Comoros", code: "KM", dial: "+269", flag: "km" },
            { name: "Lesotho", code: "LS", dial: "+266", flag: "ls" },
            { name: "Eswatini", code: "SZ", dial: "+268", flag: "sz" },
            { name: "Namibia", code: "NA", dial: "+264", flag: "na" },
            { name: "Mauritania", code: "MR", dial: "+222", flag: "mr" },
            { name: "Guinea", code: "GN", dial: "+224", flag: "gn" },
            { name: "Guinea-Bissau", code: "GW", dial: "+245", flag: "gw" },
            { name: "Equatorial Guinea", code: "GQ", dial: "+240", flag: "gq" },
            { name: "Gabon", code: "GA", dial: "+241", flag: "ga" },
            { name: "Congo", code: "CG", dial: "+242", flag: "cg" },
            { name: "Central African Republic", code: "CF", dial: "+236", flag: "cf" },
            { name: "Burundi", code: "BI", dial: "+257", flag: "bi" },
            { name: "Madagascar", code: "MG", dial: "+261", flag: "mg" },
            { name: "Cabo Verde", code: "CV", dial: "+238", flag: "cv" },
            { name: "Sao Tome & Principe", code: "ST", dial: "+239", flag: "st" },
            { name: "Djibouti", code: "DJ", dial: "+253", flag: "dj" },
            { name: "Eritrea", code: "ER", dial: "+291", flag: "er" },
            { name: "South Sudan", code: "SS", dial: "+211", flag: "ss" },
            { name: "Algeria", code: "DZ", dial: "+213", flag: "dz" },
            { name: "Tunisia", code: "TN", dial: "+216", flag: "tn" },
            { name: "Libya", code: "LY", dial: "+218", flag: "ly" },
            { name: "United Kingdom", code: "GB", dial: "+44", flag: "gb" },
            { name: "United States", code: "US", dial: "+1", flag: "us" },
            { name: "Canada", code: "CA", dial: "+1", flag: "ca" },
            { name: "Australia", code: "AU", dial: "+61", flag: "au" },
            { name: "Other", code: "XX", dial: "+0", flag: "xx" }
        ];
        const DIAL_MAP = {};
        NATIONALITIES.forEach(n => { DIAL_MAP[n.dial] = n; });

        const JOB_ROLES = [
            { title: "Health Care Support Worker", salary: "£2,300 / month", category: "Healthcare", desc: "Provide personal care, medication support, and daily assistance to patients in healthcare settings. Work alongside nurses and doctors to ensure patient wellbeing. Compassionate attitude and care experience required." },
            { title: "Caregiver", salary: "£2,100 / month", category: "Healthcare", desc: "Assist elderly and vulnerable individuals with daily living activities including bathing, dressing, feeding, and mobility support. Provide companionship and emotional support. Patient and caring nature essential." },
            { title: "Security / Safety Officer", salary: "£2,400 / month", category: "Security & Safety", desc: "Monitor premises, conduct patrols, control access points, and respond to incidents. Maintain safety records and coordinate with local authorities. Security license or equivalent certification required." },
            { title: "Warehouse Safety Supervisor", salary: "£2,250 / month", category: "Logistics & Warehousing", desc: "Oversee warehouse safety protocols, conduct risk assessments, train staff on safe equipment operation, and ensure compliance with health and safety regulations. NEBOSH or IOSH certification preferred." },
            { title: "Laborer (Skilled)", salary: "£2,000 / month", category: "Construction & Manual Labor", desc: "Perform skilled manual labor on construction and industrial sites including concrete work, framing, loading, and equipment operation. Physical fitness and prior construction experience required." },
            { title: "Cleaner Supervisor / Industrial Cleaner", salary: "£1,950 / month", category: "Cleaning & Maintenance", desc: "Supervise cleaning teams or perform industrial cleaning duties in commercial facilities, hospitals, and factories. Knowledge of cleaning chemicals, equipment, and safety procedures required." },
            { title: "HSE Assistant", salary: "£2,350 / month", category: "Health, Safety & Environment", desc: "Support the Health, Safety and Environment team with inspections, incident reporting, safety training, and compliance documentation. Strong attention to detail and HSE certification preferred." },
            { title: "Environmental & Safety Officer", salary: "£2,400 / month", category: "Health, Safety & Environment", desc: "Develop and implement environmental and safety policies, conduct audits, manage waste disposal, and ensure regulatory compliance. Environmental science or safety management background required." },
            { title: "Cruise Ship Staff", salary: "£2,200 / month", category: "Hospitality & Tourism", desc: "Provide guest services, assist with activities, manage guest relations, and ensure an exceptional cruise experience. Excellent communication skills and hospitality background required. Accommodation included." },
            { title: "Housekeeping Attendant (Cruise Ship)", salary: "£1,900 / month", category: "Hospitality & Tourism", desc: "Maintain cleanliness of guest cabins, public areas, and crew quarters aboard cruise ships. Change linens, restock supplies, and ensure high hygiene standards. Previous housekeeping experience preferred." },
            { title: "Kitchen Assistant (Cruise Ship)", salary: "£2,050 / month", category: "Hospitality & Tourism", desc: "Assist chefs with food preparation, maintain kitchen cleanliness, wash dishes, and manage food storage on cruise ships. Food hygiene certification required. Ability to work in fast-paced environment." },
            { title: "Waiter / Waitress (Cruise Ship)", salary: "£2,150 / month", category: "Hospitality & Tourism", desc: "Serve meals and beverages to guests in cruise ship dining rooms and restaurants. Take orders, deliver food, and ensure guest satisfaction. TIPS certification and fine dining experience preferred." },
            { title: "Security Personnel (Cruise Ship)", salary: "£2,300 / month", category: "Security & Safety", desc: "Maintain safety and security aboard cruise vessels, conduct passenger screenings, monitor surveillance systems, and respond to emergencies. Maritime security experience and STCW certification required." },
            { title: "Farm Worker", salary: "£1,950 / month", category: "Agriculture & Farming", desc: "Perform general farm duties including planting, cultivating, harvesting crops, and maintaining farm equipment. Ability to work outdoors in all weather conditions. Accommodation may be provided." },
            { title: "Greenhouse Worker", salary: "£2,000 / month", category: "Agriculture & Farming", desc: "Work in modern greenhouse facilities managing plant care, irrigation systems, climate control, and harvesting. Knowledge of horticulture and crop management practices preferred." },
            { title: "Fruit & Vegetable Harvester", salary: "£1,900 / month", category: "Agriculture & Farming", desc: "Harvest fruits and vegetables by hand during seasonal peaks. Sort, grade, and package produce for distribution. Physically demanding role suitable for hard-working individuals. Accommodation often provided." },
            { title: "Livestock Farm Assistant", salary: "£2,100 / month", category: "Agriculture & Farming", desc: "Assist with feeding, watering, and caring for livestock including cattle, sheep, pigs, or poultry. Maintain animal housing and monitor herd health. Previous livestock experience required." },
            { title: "Agricultural Laborer", salary: "£2,250 / month", category: "Agriculture & Farming", desc: "Operate farm machinery, assist with crop spraying, irrigation management, and general farm maintenance. Tractor driving experience and mechanical aptitude required." },
            { title: "Driver", salary: "£2,250 / month", category: "Driving", desc: "Transport goods and passengers safely across European routes. Maintain vehicle logs, perform pre-trip inspections, and ensure timely deliveries. Valid EU/UK driving license and clean driving record required." }
        ];
        const JOBS_SEED = COUNTRIES.flatMap(c => JOB_ROLES.map((r, i) => ({ ...r, country: c, id: "fallback_" + i + "_" + c })));
        allJobs = JOBS_SEED.map((j, i) => ({ id: "fallback_" + i, ...j }));
        let countryJobCounts = {};
        computeCountryCounts();

        function flagUrl(code) { return `${FLAG_BASE}${code}.svg`; }
        function esc(s) { if (!s) return ""; return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
        class SearchableSelect {
            constructor({ container, name, options, value, placeholder, onChange }){
                this.opts=options; this.onChange=onChange; this.sel=value||'';
                this.ph=placeholder||'Select...';
                this.w=document.createElement('div'); this.w.className='cs-wrapper';
                this.b=document.createElement('button'); this.b.type='button'; this.b.className='cs-button';
                this.fi=document.createElement('img'); this.fi.className='cs-flag'; this.fi.alt='';
                this.l=document.createElement('span'); this.l.className='cs-label';
                this.a=document.createElement('span'); this.a.className='cs-arrow'; this.a.textContent='▾';
                this.b.append(this.fi,this.l,this.a);
                this.d=document.createElement('div'); this.d.className='cs-dropdown';
                this.si=document.createElement('input'); this.si.type='text'; this.si.className='cs-filter-input'; this.si.placeholder='Type to filter...';
                this.oc=document.createElement('div'); this.oc.className='cs-options';
                this.d.append(this.si,this.oc); this.w.append(this.b,this.d);
                this.hi=document.createElement('input'); this.hi.type='hidden'; this.hi.name=name;
                this.w.append(this.hi);
                container.appendChild(this.w);
                this._render(); this._upd(); this._evt();
            }
            _render(f){
                this.oc.innerHTML='';
                const items=f?this.opts.filter(o=>o.label.toLowerCase().includes(f.toLowerCase())):this.opts;
                if(!items.length){this.oc.innerHTML='<div class="cs-no-results">No matches found</div>';return;}
                items.forEach(o=>{
                    const d=document.createElement('div'); d.className='cs-option'+(o.value===this.sel?' selected':'');
                    d.dataset.value=o.value;
                    const i=document.createElement('img'); i.className='cs-flag'; i.src=flagUrl(o.flag);
                    const s=document.createElement('span'); s.textContent=o.label;
                    d.append(i,s);
                    if(o.sublabel){const x=document.createElement('span'); x.className='cs-sublabel'; x.textContent=o.sublabel; d.append(x);}
                    d.addEventListener('click',()=>this._sel(o.value));
                    d.addEventListener('mouseenter',()=>{this.oc.querySelectorAll('.highlighted').forEach(e=>e.classList.remove('highlighted')); d.classList.add('highlighted');});
                    this.oc.append(d);
                });
            }
            _upd(){
                const o=this.opts.find(x=>x.value===this.sel);
                if(o){this.fi.src=flagUrl(o.flag);this.fi.style.display='';this.l.textContent=o.label;this.l.className='cs-label';}
                else{this.fi.style.display='none';this.l.textContent=this.ph;this.l.className='cs-label cs-placeholder';}
            }
            _sel(v){this.sel=v;this.hi.value=v;this._upd();this._cls();if(this.onChange)this.onChange(v);}
            _opn(){this.w.classList.add('cs-open');this.si.value='';this._render();this.si.focus();}
            _cls(){this.w.classList.remove('cs-open');}
            _evt(){
                this.b.addEventListener('click',e=>{e.stopPropagation();this.w.classList.contains('cs-open')?this._cls():this._opn();});
                this.si.addEventListener('input',()=>this._render(this.si.value));
                document.addEventListener('click',e=>{if(!this.w.contains(e.target))this._cls();});
                this.si.addEventListener('keydown',e=>{
                    if(e.key==='Escape'){this._cls();this.b.focus();}
                    if(e.key==='Enter'){const h=this.oc.querySelector('.highlighted');if(h)this._sel(h.dataset.value);}
                    if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();const items=this.oc.querySelectorAll('.cs-option');if(!items.length)return;
                        let idx=-1;const curr=this.oc.querySelector('.highlighted');if(curr)idx=Array.from(items).indexOf(curr);
                        idx=e.key==='ArrowDown'?Math.min(idx+1,items.length-1):Math.max(idx-1,0);
                        items.forEach(el=>el.classList.remove('highlighted'));items[idx].classList.add('highlighted');items[idx].scrollIntoView({block:'nearest'});}
                });
                this.b.addEventListener('keydown',e=>{
                    if(e.key.length===1&&!e.ctrlKey&&!e.metaKey&&!e.altKey){this._opn();this.si.value=e.key;this._render(e.key);this.si.setSelectionRange(1,1);}
                });
            }
            getValue(){return this.sel;}
            setValue(v){this.sel=v;this.hi.value=v;this._upd();}
            destroy(){this.w.remove();}
        }
        function displayId(a) { return a.appId || a.id || a.uid || ''; }
        function displayName(a) { return a.fullName || a.appId || a.id || a.uid || 'Unknown'; }
        function dedupApps(arr) {
            const map = {};
            arr.forEach(a => {
                const key = a.id || a.uid;
                const existing = map[key];
                if (!existing) { map[key] = a; return; }
                const s1 = (existing.fullName ? 2 : 0) + (existing.email ? 1 : 0) + (existing.nationality ? 1 : 0);
                const s2 = (a.fullName ? 2 : 0) + (a.email ? 1 : 0) + (a.nationality ? 1 : 0);
                if (s2 > s1) map[key] = a;
            });
            return Object.values(map).filter(a => a.uid || a.fullName || a.email);
        }
        function calcCompleteness(a) {
            const fields=[a.fullName,a.email,a.phone,a.nationality,a.dob,a.passportNumber,a.education,a.jobTitle,a.country];
            const f=fields.filter(Boolean).length;
            const cv=!!(a.cvUrl);
            const pass=!!(a.passportUrl);
            const _v=k=>a.documentStatus?.[k]==='verified'||!!a.documentsVerified?.[k];
            const cvV=_v('cv'),passV=_v('passport');
            const total=9+2+2;
            let score=f;
            if(cv)score++; if(pass)score++;
            if(cvV)score++; if(passV)score++;
            return Math.min(100,Math.round((score/total)*100));
        }
        function docStatusBadge(st){
            const m={
                'not_uploaded':['badge-slate','Not Uploaded'],
                'submitted':['badge-blue','Submitted'],
                'received':['badge-blue','Received'],
                'pending_review':['badge-amber','Pending Review'],
                'processing':['badge-indigo','Processing'],
                'verified':['badge-green','Verified'],
                'rejected':['badge-rose','Rejected'],
                'upload_again':['badge-rose','Re-upload Required'],
                'reuploaded':['badge-indigo','Re-uploaded'],
                'changes_requested':['badge-rose','Changes Requested']
            };
            const b=m[st]||m['not_uploaded'];
            return `<span class="badge ${b[0]}"><i class="fa-solid fa-circle" style="font-size:7px"></i> ${b[1]}</span>`;
        }
        async function notifyApplicant(uid, name, msgText) {
            try {
                if (!currentUser||!uid) return;
                const chat = await getOrCreateChat(uid, name);
                if (!chat) return;
                const mr = doc(collection(db, "chats", chat.id, "messages"));
                await setDoc(mr, { senderId: currentUser.uid, senderName: 'Admin', text: msgText, fileUrl: '', fileName: '', timestamp: serverTimestamp(), read: false });
                const cr = doc(db, "chats", chat.id);
                await updateDoc(cr, { [`unread.${uid}`]: increment(1), lastMessage: msgText, lastTimestamp: serverTimestamp(), lastSender: currentUser.uid });
            } catch (e) { console.warn("notifyApplicant error:", e); }
        }
        async function notifyAdmin(msgText) {
            try {
                if (!currentUser) return;
                const chat = await getOrCreateChat();
                if (!chat) return;
                const mr = doc(collection(db, "chats", chat.id, "messages"));
                await setDoc(mr, { senderId: currentUser.uid, senderName: currentUserData?.fullName || 'Applicant', text: msgText, fileUrl: '', fileName: '', timestamp: serverTimestamp(), read: false });
                const cr = doc(db, "chats", chat.id);
                const participants = chat.participants || [];
                const updates = {};
            participants.forEach(p => { if (p && p !== currentUser.uid) updates[`unread.${p}`] = increment(1); });
                updates.lastMessage = msgText;
                updates.lastTimestamp = serverTimestamp();
                updates.lastSender = currentUser.uid;
                await updateDoc(cr, updates);
            } catch (e) { console.warn("notifyAdmin error:", e); }
        }
        let _fixAdminHash = '';
        async function fixAdminChatNames() {
            try {
                const adminUids = await getAllAdminUids();
                const hash = adminUids.sort().join(',');
                if (hash === _fixAdminHash) return;
                _fixAdminHash = hash;
                if (!adminUids.length) return;
                const snap = await getDocs(collection(db, "chats"));
                let fixed = 0;
                for (const d of snap.docs) {
                    const data = d.data();
                    const missingAdmins = adminUids.filter(uid => !data.participants?.includes(uid));
                    if (missingAdmins.length) {
                        const updates = { participants: arrayUnion(...missingAdmins) };
                        missingAdmins.forEach(uid => {
                            updates[`participantNames.${uid}`] = 'Admin';
                            updates[`unread.${uid}`] = 0;
                        });
                        await updateDoc(d.ref, updates);
                        fixed += missingAdmins.length;
                    }
                    for (const uid of adminUids) {
                        if (data.participantNames?.[uid] && data.participantNames[uid] !== "Admin") {
                            await updateDoc(d.ref, { [`participantNames.${uid}`]: "Admin" });
                            fixed++;
                        }
                    }
                }
                if (fixed) console.log(`Fixed ${fixed} admin entries across chats.`);
            } catch (e) { console.warn("fixAdminChatNames error:", e); }
        }
        const LOCALE = 'en-GB';
        function fmtDate(ts) {
            if (!ts) return "—";
            if (ts.toDate) ts = ts.toDate();
            const d = new Date(ts);
            return d.toLocaleDateString(LOCALE, { year: 'numeric', month: 'short', day: 'numeric' }) + " · " + d.toLocaleTimeString(LOCALE, { hour: '2-digit', minute: '2-digit' });
        }
        function fmtTime(ts) {
            if (!ts) return "";
            if (ts.toDate) ts = ts.toDate();
            return new Date(ts).toLocaleTimeString(LOCALE, { hour: '2-digit', minute: '2-digit' });
        }
        function fmtDateShort(ts) {
            if (!ts) return "";
            if (ts.toDate) ts = ts.toDate();
            const d = new Date(ts);
            const now = new Date();
            const diff = (now - d) / (1000 * 60 * 60 * 24);
            if (diff < 1) return fmtTime(ts);
            if (diff < 7) return d.toLocaleDateString(LOCALE, { weekday: 'short' });
            return d.toLocaleDateString(LOCALE, { month: 'short', day: 'numeric' });
        }
        function fmtMsgTime(ts) {
            if (!ts) return "";
            if (ts.toDate) ts = ts.toDate();
            return new Date(ts).toLocaleTimeString(LOCALE, { hour: '2-digit', minute: '2-digit' });
        }
        function formatMsgDate(ts) {
            if (!ts) return "";
            if (ts.toDate) ts = ts.toDate();
            const d = new Date(ts);
            const now = new Date();
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);
            const dDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());
            if (dDate.getTime() === today.getTime()) return "Today";
            if (dDate.getTime() === yesterday.getTime()) return "Yesterday";
            if (d.getFullYear() === now.getFullYear()) return d.toLocaleDateString(LOCALE, { weekday: 'short', month: 'short', day: 'numeric' });
            return d.toLocaleDateString(LOCALE, { year: 'numeric', month: 'short', day: 'numeric' });
        }
        function shouldShowDateSeparator(msg, prevMsg) {
            if (!prevMsg) return true;
            const getDay = (ts) => { if (!ts) return null; const d = ts.toDate ? ts.toDate() : new Date(ts); return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime(); };
            const currDay = getDay(msg.timestamp);
            const prevDay = getDay(prevMsg.timestamp);
            return currDay !== prevDay;
        }
        function genAppId() {
            const yr = new Date().getFullYear();
            const rand = Math.floor(100000 + Math.random() * 899999);
            return `ESJ-${yr}-${rand}`;
        }
        function toast(msg, type) {
            const wrap = document.getElementById('toast-wrap');
            const el = document.createElement('div');
            el.className = 'toast' + (type ? ' ' + type : '');
            const icon = type === 'err' ? 'fa-circle-exclamation' : type === 'ok' ? 'fa-circle-check' : 'fa-bell';
            el.innerHTML = `<i class="fa-solid ${icon}"></i><span>${esc(msg)}</span>`;
            wrap.appendChild(el);
            const duration = type === 'err' ? 6000 : 3600;
            setTimeout(() => { el.style.opacity = '0'; el.style.transition = '.3s'; setTimeout(() => el.remove(), 300); }, duration);
        }
        window.toast = toast;
        function statusTone(status) {
            if (status === "Placed — Active Employment") return "green";
            if (status === "Rejected") return "rose";
            if (status === "On Hold" || status === "Withdrawn by Applicant") return "amber";
            return "maroon";
        }
        function statusBadge(status) {
            if (!status) return `<span class="badge badge-slate"><i class="fa-solid fa-circle" style="font-size:7px"></i> No Status</span>`;
            const tone = statusTone(status);
            const cls = tone === 'green' ? 'badge-green' : tone === 'rose' ? 'badge-rose' : tone === 'amber' ? 'badge-amber' : 'badge-maroon';
            const icon = tone === 'green' ? 'fa-circle-check' : tone === 'rose' ? 'fa-circle-xmark' : tone === 'amber' ? 'fa-triangle-exclamation' : 'fa-circle';
            return `<span class="badge ${cls}"><i class="fa-solid ${icon}" style="font-size:7px"></i> ${esc(status)}</span>`;
        }
        function validateFileSize(maxMB=10) {
            return (info) => {
                if (info.size && info.size > maxMB * 1024 * 1024) { toast(`File too large (max ${maxMB}MB).`, 'err'); throw new Error('File too large'); }
                return info;
            };
        }
        async function addAuditLog(action, details, targetId='') {
            try { await addDoc(collection(db,"auditLog"),{action,details,targetId,adminEmail:currentUserData?.email||currentUser?.email||'unknown',timestamp:serverTimestamp()}); } catch(e) { console.warn("Audit log:",e.message); }
        }
        function simulateEmail(to, subject, body) {
            console.log(`📧 [SIMULATED] To: ${to}\nSubject: ${subject}\nBody: ${body}`);
            toast(`📧 Email notification sent to ${to}`, 'ok');
            const mailto = `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
            const w = window.open(mailto, '_blank');
            if (!w || w.closed) {
                const a = document.createElement('a'); a.href = mailto; a.style.display = 'none'; document.body.appendChild(a); a.click(); document.body.removeChild(a);
            }
        }

        function mergeJobs(live) {
            const seed = JOBS_SEED.map((j, i) => ({ id: "fallback_" + i, ...j }));
            if (live.length === 0) return seed;
            const dbJobs = live.filter(j => !j.id || !String(j.id).startsWith('fallback_'));
            if (dbJobs.length === 0) return seed;
            return [...seed, ...dbJobs];
        }
        function computeCountryCounts() {
            const c = {};
            COUNTRIES.forEach(cn => c[cn] = 0);
            allJobs.forEach(j => { if (c[j.country] !== undefined) c[j.country]++; });
            countryJobCounts = c;
        }
        async function loadJobs() {
            if (allJobs.length === 0) {
                allJobs = JOBS_SEED.map((j, i) => ({ id: "fallback_" + i, ...j }));
                computeCountryCounts();
            }
            getDocs(collection(db, "jobs")).then(snapshot => {
                const live = [];
                snapshot.forEach(d => live.push({ id: d.id, ...d.data() }));
                if (live.length > 0) {
                    allJobs = mergeJobs(live);
                    computeCountryCounts();
                    if (["jobs", "home", "apply", "applicant-dashboard"].includes(ROUTE.view)) renderCurrentView();
                }
            }).catch(e => {
                console.warn("loadJobs fetch error:", e.message);
            });
            return allJobs;
        }
        async function addJob(jobData) {
            const ref = doc(collection(db, "jobs"));
            await setDoc(ref, { ...jobData, createdAt: serverTimestamp() });
            await loadJobs();
            return ref.id;
        }
        async function deleteJob(jobId) { await deleteDoc(doc(db, "jobs", jobId)); await loadJobs(); }

        async function loadApps() {
            try {
                const snapshot = await getDocs(collection(db, "applications"));
                const live = [];
                snapshot.forEach(d => live.push({ id: d.id, ...d.data() }));
                allApps = dedupApps(live);
                if (ROUTE.view === "admin-dashboard") renderCurrentView();
            } catch(e) { console.warn("loadApps:", e.message); }
            return allApps;
        }
        async function getApp(appId) {
            try {
                const docSnap = await getDoc(doc(db, "applications", appId));
                if (docSnap.exists()) return { id: docSnap.id, ...docSnap.data() };
            } catch (e) { /* may be restricted */ }
            return null;
        }
        async function createApp(appData) {
            const appNum = genAppId();
            const ref = doc(db, "applications", appNum);
            const newApp = {
                ...appData, id: appNum, appId: appNum,
                timeline: [{ status: "Application Received", date: new Date().toISOString(), note: "Application submitted." }],
                internalNotes: [], clientServices: [], archived: false, blocked: false,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                status: appData.status || "Application Received",
                documentStatus: appData.documentStatus || { cv: "not_uploaded", passport: "not_uploaded", certificates: "not_uploaded", reference: "not_uploaded", medical: "not_uploaded" }
            };
            await setDoc(ref, newApp);
            await loadApps();
            return newApp;
        }
        async function updateApp(appId, patch) {
            const ref = doc(db, "applications", appId);
            await setDoc(ref, { ...patch, updatedAt: serverTimestamp() }, { merge: true });
            await loadApps();
            return await getApp(appId);
        }

        async function loadFees() {
            getDocs(collection(db, "fees")).then(snapshot => {
                const live = [];
                snapshot.forEach(d => live.push({ id: d.id, ...d.data() }));
                allFees = live;
            }).catch(() => {});
            return allFees;
        }
        async function addFee(feeData) {
            const ref = doc(collection(db, "fees"));
            await setDoc(ref, { ...feeData, createdAt: serverTimestamp() });
            await loadFees();
            return ref.id;
        }
        async function deleteFee(feeId) { await deleteDoc(doc(db, "fees", feeId)); await loadFees(); }

        async function getAdminUser(uid) {
            try {
                const docSnap = await getDoc(doc(db, "admins", uid));
                if (docSnap.exists()) return { id: docSnap.id, ...docSnap.data() };
            } catch (e) { /* may be restricted */ }
            return null;
        }

        // --- MESSAGING SYSTEM (WhatsApp-like multi-device) ---
        async function getAllAdminUids(forceRefresh) {
            if (cachedAdminUids && !forceRefresh) return cachedAdminUids;
            const snap = await getDocs(collection(db, "admins"));
            const uids = [];
            snap.forEach(d => uids.push(d.id));
            cachedAdminUids = uids;
            return uids;
        }
        async function getOrCreateChat(applicantUid, applicantName) {
            if (!currentUser) return null;
            const uid = applicantUid || currentUser.uid;
            if (!uid) return null;
            const chatId = `client_${uid}`;
            const chatRef = doc(db, "chats", chatId);
            const existing = await getDoc(chatRef);
            if (existing.exists()) return { id: existing.id, ...existing.data() };
            const dup = await getDocs(query(collection(db,"chats"),where("participants","array-contains",uid)));
            if (!dup.empty) return { id: dup.docs[0].id, ...dup.docs[0].data() };
            const adminUids = cachedAdminUids || await getAllAdminUids();
            const allParticipants = [uid, ...adminUids];
            const participantNames = { [uid]: applicantName || currentUserData?.fullName || currentUser?.displayName || currentUser?.email || "User" };
            adminUids.forEach(auid => { participantNames[auid] = 'Admin'; });
            const unread = {};
            allParticipants.forEach(p => { unread[p] = 0; });
            const chatData = { participants: allParticipants, participantNames, unread, lastMessage: '', lastTimestamp: serverTimestamp(), lastSender: currentUser.uid, createdAt: serverTimestamp() };
            await setDoc(chatRef, chatData);
            return { id: chatRef.id, ...chatData };
        }

        async function sendMessage(chatId, text, fileUrl, fileName) {
            if (!text && !fileUrl) return;
            const msgRef = doc(collection(db, "chats", chatId, "messages"));
            const msgData = {
                senderId: currentUser.uid,
                senderName: currentUserData?.fullName || currentUser?.displayName || currentUser?.email || "User",
                text: text || "",
                type: fileUrl ? "file" : "text",
                fileUrl: fileUrl || "",
                fileName: fileName || "",
                timestamp: serverTimestamp(),
                read: false
            };
            await setDoc(msgRef, msgData);
            const chatRef = doc(db, "chats", chatId);
            const chatSnap = await getDoc(chatRef);
            if (!chatSnap.exists()) return;
            const participants = chatSnap.data().participants || [];
            const updates = {};
            participants.forEach(p => { if (p !== currentUser.uid) updates[`unread.${p}`] = increment(1); });
            updates.lastMessage = text || (fileUrl ? `📎 ${fileName || 'File'}` : "");
            updates.lastTimestamp = serverTimestamp();
            updates.lastSender = currentUser.uid;
            await updateDoc(chatRef, updates);
        }

        function deduplicateChats(arr) {
            const seen = {};
            return arr.filter(c => {
                const key = c.otherName || c.otherUid || c.id;
                if (seen[key]) {
                    const existing = seen[key];
                    const tNew = c.lastTimestamp ? new Date(c.lastTimestamp.seconds ? c.lastTimestamp.seconds * 1000 : c.lastTimestamp) : new Date(0);
                    const tOld = existing.lastTimestamp ? new Date(existing.lastTimestamp.seconds ? existing.lastTimestamp.seconds * 1000 : existing.lastTimestamp) : new Date(0);
                    if (tNew > tOld) Object.assign(existing, c);
                    return false;
                }
                seen[key] = c;
                return true;
            });
        }
        async function loadChats() {
            if (!currentUser) return;
            const isAdmin = currentUserData?.type === 'admin';
            const q = isAdmin ? collection(db, "chats")
                              : query(collection(db, "chats"), where("participants", "array-contains", currentUser.uid));
            return getDocs(q).then(snap => {
                allChats = [];
                snap.forEach(d => {
                    const data = d.data();
                    if (data.deleted) return;
                    let otherUid, otherName;
                    if (isAdmin) {
                        otherUid = _findOtherUidForAdmin(data);
                        otherName = otherUid ? (data.participantNames?.[otherUid] || otherUid) : "Unknown";
                    } else {
                        otherUid = data.participants?.find(p => p !== currentUser.uid);
                        otherName = otherUid ? (data.participantNames?.[otherUid] || otherUid) : "Unknown";
                    }
                    allChats.push({ id: d.id, ...data, otherUid, otherName });
                });
                allChats = deduplicateChats(allChats);
                allChats.sort((a, b) => {
                    const ta = a.lastTimestamp ? new Date(a.lastTimestamp.seconds ? a.lastTimestamp.seconds * 1000 : a.lastTimestamp) : new Date(0);
                    const tb = b.lastTimestamp ? new Date(b.lastTimestamp.seconds ? b.lastTimestamp.seconds * 1000 : b.lastTimestamp) : new Date(0);
                    return tb - ta;
                });
                if (ROUTE.view === "messages" || ROUTE.view === "messages-chat") renderCurrentView();
                return allChats;
            }).catch(() => []);
        }

        function subscribeChats() {
            if (!currentUser || unsubscribeChats) return;
            const isAdmin = currentUserData?.type === 'admin';
            const q = isAdmin ? collection(db, "chats")
                              : query(collection(db, "chats"), where("participants", "array-contains", currentUser.uid));
            unsubscribeChats = onSnapshot(q, (snapshot) => {
                allChats = [];
                snapshot.forEach(d => {
                    const data = d.data();
                    if (data.deleted) return;
                    let otherUid, otherName;
                    if (isAdmin) {
                        otherUid = _findOtherUidForAdmin(data);
                        otherName = otherUid ? (data.participantNames?.[otherUid] || otherUid) : "Unknown";
                    } else {
                        otherUid = data.participants?.find(p => p !== currentUser.uid);
                        otherName = otherUid ? (data.participantNames?.[otherUid] || otherUid) : "Unknown";
                    }
                    allChats.push({ id: d.id, ...data, otherUid, otherName });
                });
                allChats = deduplicateChats(allChats);
                allChats.sort((a, b) => {
                    const ta = a.lastTimestamp ? new Date(a.lastTimestamp.seconds ? a.lastTimestamp.seconds * 1000 : a.lastTimestamp) : new Date(0);
                    const tb = b.lastTimestamp ? new Date(b.lastTimestamp.seconds ? b.lastTimestamp.seconds * 1000 : b.lastTimestamp) : new Date(0);
                    return tb - ta;
                });
                if (ROUTE.view === "messages" || ROUTE.view === "messages-chat") renderCurrentView();
                renderNavbar();
            });
        }

        function _findOtherUidForAdmin(data) {
            if (!data.participants || !data.participantNames) return null;
            for (const uid of data.participants) {
                const name = data.participantNames[uid];
                if (name && name !== 'Admin') return uid;
            }
            const uids=(cachedAdminUids||[]);
            return data.participants.find(u => !uids.includes(u)) || data.participants[0];
        }

        function subscribeMessages(chatId) {
            if (unsubscribeMessages) unsubscribeMessages();
            olderMessages = [];
            msgEarliestTimestamp = null;
            msgHasMore = false;
            const q = query(collection(db, "chats", chatId, "messages"), orderBy("timestamp", "asc"), limitToLast(PAGE_SIZE));
            unsubscribeMessages = onSnapshot(q, (snapshot) => {
                const msgs = [];
                snapshot.forEach(d => msgs.push({ id: d.id, ...d.data() }));
                if (olderMessages.length === 0) {
                    if (msgs.length === PAGE_SIZE) msgEarliestTimestamp = msgs[0].timestamp;
                    msgHasMore = msgs.length === PAGE_SIZE;
                }
                if (ROUTE.view === "messages-chat") {
                    renderMessagesChat(chatId, [...olderMessages, ...msgs]);
                }
                markChatRead(chatId);
            }, (error) => {
                console.error("Messages subscription error:", error);
                toast("Error loading messages. Please try again.", "err");
            });
        }

        async function loadOlderMessages(chatId) {
            if (!msgEarliestTimestamp) return;
            const q = query(collection(db, "chats", chatId, "messages"), orderBy("timestamp", "desc"), limit(PAGE_SIZE), startAfter(msgEarliestTimestamp));
            const snap = await getDocs(q);
            const older = [];
            snap.forEach(d => older.push({ id: d.id, ...d.data() }));
            if (!older.length) { msgHasMore = false; return; }
            older.reverse();
            msgEarliestTimestamp = older[0].timestamp;
            msgHasMore = older.length === PAGE_SIZE;
            olderMessages = [...older, ...olderMessages];
            const body = document.getElementById('msgChatBody');
            if (body) body.querySelector('.load-older-wrap')?.remove();
            if (ROUTE.view === "messages-chat") renderMessagesChat(chatId, [...olderMessages, ...currentChatMessages]);
        }

        async function markChatRead(chatId) {
            if (!currentUser) return;
            const chatRef = doc(db, "chats", chatId);
            await updateDoc(chatRef, { [`unread.${currentUser.uid}`]: 0 }).catch(() => {});
        }

        function getUnreadCount() {
            if (!currentUser || !allChats.length) return 0;
            return allChats.reduce((sum, c) => sum + ((c.unread?.[currentUser.uid]) || 0), 0);
        }

        onAuthStateChanged(auth, async (user) => {
            try {
                currentUser = user;
                if (user) {
                    renderNavbar();
                    const adminRes = await getAdminUser(user.uid);
                    if (adminRes) {
                        currentUserData = { ...adminRes, type: 'admin' };
                        getAllAdminUids().catch(()=>{});
                        loadApps();
                        loadChats().then(() => subscribeChats());
                        fixAdminChatNames().finally(() => loadChats());
                        restoreLastRoute();
                        if (ROUTE.view === 'login') navigate("admin-dashboard");
                        renderNavbar(); renderCurrentView();
                    } else {
                        try {
                            let snap = await getDocs(query(collection(db,"applications"),where("uid","==",user.uid)));
                            let allUserApps=[];
                            snap.forEach(d=>allUserApps.push({id:d.id,...d.data()}));
                            if (allUserApps.length === 0) {
                                await new Promise(r => setTimeout(r, 1200));
                                snap = await getDocs(query(collection(db,"applications"),where("uid","==",user.uid)));
                                snap.forEach(d=>allUserApps.push({id:d.id,...d.data()}));
                            }
                            const primary=allUserApps.find(a=>a.id===user.uid);
                            if(primary) currentUserData = { ...primary, type: 'applicant', allApps: allUserApps };
                            else if(allUserApps.length) currentUserData = { ...allUserApps[0], type: 'applicant', allApps: allUserApps };
                            else currentUserData = { type: 'needs-profile' };
                        } catch(e) {
                            currentUserData = { type: 'needs-profile' };
                        }
                        if (currentUserData?.blocked) { signOut(auth); toast("Your account has been blocked.","err"); return; }
                        getAllAdminUids().catch(()=>{});
                        const chatsReady = loadChats().then(() => subscribeChats());
                        fixAdminChatNames().finally(() => loadChats());
                        await chatsReady;
                        restoreLastRoute();
                        if (ROUTE.view === 'login') navigate("applicant-dashboard");
                        renderNavbar();renderCurrentView();
                    }
                } else {
                    currentUserData = null;
                    if (unsubscribeApps) { unsubscribeApps(); unsubscribeApps = null; }
                    if (unsubscribeJobs) { unsubscribeJobs(); unsubscribeJobs = null; }
                    if (unsubscribeFees) { unsubscribeFees(); unsubscribeFees = null; }
                    if (unsubscribeChats) { unsubscribeChats(); unsubscribeChats = null; }
                    if (unsubscribeMessages) { unsubscribeMessages(); unsubscribeMessages = null; }
                    olderMessages = []; msgEarliestTimestamp = null; msgHasMore = false;
                    renderNavbar(); renderCurrentView();
                }
            } catch (e) { console.error("Auth handler error:", e); }
        });

        function subscribeToRealtime() {
            if (unsubscribeApps) unsubscribeApps();
            unsubscribeApps = onSnapshot(collection(db, "applications"), (snapshot) => {
                const live = [];
                snapshot.forEach(d => live.push({ id: d.id, ...d.data() }));
                allApps = dedupApps(live);
                if (["admin-dashboard", "applicant-dashboard", "messages", "messages-chat", "admin-jobs", "admin-finance"].includes(ROUTE.view)) renderCurrentView();
            });
            if (unsubscribeJobs) unsubscribeJobs();
            try {
                unsubscribeJobs = onSnapshot(collection(db, "jobs"), (snapshot) => {
                    const live = [];
                    snapshot.forEach(d => live.push({ id: d.id, ...d.data() }));
                    allJobs = mergeJobs(live);
                    computeCountryCounts();
                    if (["jobs", "admin-jobs", "home", "apply"].includes(ROUTE.view)) renderCurrentView();
                }, (err) => {
                    if (!usingFallbackJobs) {
                        allJobs = JOBS_SEED.map((j, i) => ({ id: "fallback_" + i, ...j }));
                        usingFallbackJobs = true;
                        computeCountryCounts();
                        if (["jobs", "admin-jobs", "home", "apply"].includes(ROUTE.view)) renderCurrentView();
                    }
                });
            } catch (e) {
                console.warn("Jobs realtime subscription failed:", e.message);
            }
            if (unsubscribeFees) unsubscribeFees();
            unsubscribeFees = onSnapshot(collection(db, "fees"), (snapshot) => {
                allFees = [];
                snapshot.forEach(d => allFees.push({ id: d.id, ...d.data() }));
                if (["fees", "admin-fees"].includes(ROUTE.view)) renderCurrentView();
            });
        }

        history.scrollRestoration = 'manual';
        let ROUTE = { view: "home", params: {} };
        function saveScrollPos() {
            try { sessionStorage.setItem('scrollPos_' + ROUTE.view, String(window.scrollY)); } catch(e) {}
        }
        function restoreScrollPos() {
            try {
                const saved = sessionStorage.getItem('scrollPos_' + ROUTE.view);
                if (saved) { const sy = parseInt(saved, 10); if (!isNaN(sy)) requestAnimationFrame(() => window.scrollTo({ top: sy })); }
            } catch(e) {}
        }
        function saveAdminFilters() {
            try { sessionStorage.setItem('adminFilters', JSON.stringify(adminFilters)); } catch(e) {}
        }
        function restoreAdminFilters() {
            try {
                const saved = sessionStorage.getItem('adminFilters');
                if (saved) { const f = JSON.parse(saved); if (f && typeof f === 'object') Object.assign(adminFilters, f); }
            } catch(e) {}
        }
        function saveRouteState() {
            try {
                sessionStorage.setItem('lastRoute', JSON.stringify(ROUTE));
                saveScrollPos();
                saveAdminFilters();
            } catch(e) {}
        }
        function initHistoryState() {
            if (!history.state || !history.state.view) {
                history.replaceState({ ...ROUTE, scrollY: 0 }, '');
            }
        }
        function restoreLastRoute() {
            initHistoryState();
            const saved = sessionStorage.getItem('lastRoute');
            if (saved) { try { const r = JSON.parse(saved); if (r.view && r.view !== 'login') { ROUTE = r; renderCurrentView(); restoreScrollPos(); return; } } catch(e) {} }
            if (ROUTE.view === 'login') navigate("applicant-dashboard");
        }
        function navigate(view, params = {}) {
            if (view === ROUTE.view && JSON.stringify(params) === JSON.stringify(ROUTE.params)) return;
            saveRouteState();
            const appEl = document.getElementById('app');
            if (history.state && history.state.view) {
                history.replaceState({ ...history.state, scrollY: window.scrollY }, '');
            }
            ROUTE = { view, params };
            history.pushState({ ...ROUTE, scrollY: 0 }, '');
            appEl.classList.add('fade-out');
            requestAnimationFrame(() => {
                window.scrollTo({ top: 0 });
                renderCurrentView();
                const nl = document.getElementById('navLinks');
                if (nl) nl.classList.remove('open');
                saveRouteState();
                requestAnimationFrame(() => {
                    appEl.classList.remove('fade-out');
                    restoreScrollPos();
                });
            });
        }
        const _throttleResize = (() => { let t; return (fn, ms) => { clearTimeout(t); t = setTimeout(fn, ms); }; })();
        window.addEventListener('resize', () => { _throttleResize(() => { saveRouteState(); }, 300); });
        window.addEventListener('beforeunload', () => { saveRouteState(); });
        window.addEventListener('popstate', (e) => {
            if (e.state && e.state.view && e.state.view !== ROUTE.view) {
                saveRouteState();
                ROUTE = e.state;
                const appEl = document.getElementById('app');
                appEl.classList.add('fade-out');
                requestAnimationFrame(() => {
                    renderCurrentView();
                    requestAnimationFrame(() => {
                        appEl.classList.remove('fade-out');
                        const sy = e.state.scrollY || 0;
                        requestAnimationFrame(() => window.scrollTo({ top: sy }));
                    });
                });
            }
        });
        restoreAdminFilters();

        // Admin access is granted ONLY via Firestore admins/{uid} documents (secure, server-side).
        // To add an admin, create a document in the "admins" collection with their Firebase Auth UID.
        async function isAdminEmail(email) { return false; }

        let _loadingCount = 0;
        function showLoading() {
            _loadingCount++;
            if (_loadingCount === 1) {
                let ov = document.getElementById('loadingOverlay');
                if (!ov) {
                    ov = document.createElement('div');
                    ov.id = 'loadingOverlay';
                    ov.className = 'loading-overlay';
                    ov.innerHTML = '<div class="spinner"></div>';
                    document.body.appendChild(ov);
                }
                ov.style.display = 'flex';
            }
        }
        function hideLoading() {
            _loadingCount = Math.max(0, _loadingCount - 1);
            if (_loadingCount === 0) {
                const ov = document.getElementById('loadingOverlay');
                if (ov) ov.style.display = 'none';
            }
        }
        function renderNavbar() {
            const nav = document.getElementById('navbar');
            const links = [
                { v: "home", label: "Home" },
                { v: "jobs", label: "Browse Jobs" },
                { v: "status", label: "Check Status" },
                { v: "fees", label: "Fees" },
                { v: "faq", label: "FAQ" }
            ];
            const activeView = ROUTE.view;
            const isActive = (v) => {
                if (activeView === v) return true;
                if (v === 'home' && activeView === '') return true;
                if (v === 'applicant-dashboard' && ['applicant-dashboard', 'confirmation', 'messages', 'messages-chat'].includes(activeView)) return true;
                if (v === 'admin-dashboard' && activeView.startsWith('admin-')) return true;
                if (v === 'admin-finance' && activeView.startsWith('admin-')) return true;
                return false;
            };
            let rightHtml = "";
            if (currentUser && currentUserData) {
                const unread = getUnreadCount();
                const msgBadge = unread ? `<span class="msg-count">${unread}</span>` : '';
                if (currentUserData.type === 'applicant' || currentUserData.type === 'needs-profile') {
                    rightHtml = `<a class="nav-link ${isActive('applicant-dashboard') ? 'active' : ''}" data-nav="applicant-dashboard"><i class="fa-solid fa-user"></i> My Portal</a>
                <button class="btn btn-outline btn-sm" data-action="logout">Log out</button>`;
                } else if (currentUserData.type === 'admin') {
                    rightHtml = `<a class="nav-link ${isActive('messages') ? 'active' : ''}" data-nav="messages"><i class="fa-solid fa-comment-dots"></i> Messages${msgBadge}</a>
                <a class="nav-link ${isActive('admin-dashboard') ? 'active' : ''}" data-nav="admin-dashboard"><i class="fa-solid fa-shield-halved"></i> Admin</a>
                <button class="btn btn-outline btn-sm" data-action="logout">Log out</button>`;
                }
            } else {
                rightHtml = `<a class="btn btn-outline btn-sm" data-nav="login">Log In</a>
              <a class="btn btn-maroon btn-sm" data-nav="apply"><i class="fa-solid fa-paper-plane"></i> Apply Now</a>`;
            }
            const html = `
            <div class="wrap nav-inner">
              <a class="brand" data-nav="home">
                <span class="brand-mark"><i class="fa-solid fa-earth-europe"></i></span>
                Europe Sponsor Jobs
              </a>
              <div class="nav-links" id="navLinks">
                ${links.map(l => `<a class="nav-link ${ROUTE.view === l.v ? 'active' : ''}" data-nav="${l.v}">${l.label}</a>`).join("")}
                <div class="nav-cta">${rightHtml}</div>
              </div>
              <button class="nav-mobile-toggle" id="mobileToggle"><i class="fa-solid fa-bars"></i></button>
            </div>`;
            nav.innerHTML = html;
            nav.querySelectorAll('[data-nav]').forEach(el => el.addEventListener('click', () => navigate(el.getAttribute('data-nav'))));
            const mt = document.getElementById('mobileToggle');
            if (mt) mt.addEventListener('click', () => document.getElementById('navLinks').classList.toggle('open'));
        }

        const PER_PAGE_OPTS = [10, 25, 50, 100, 'All'];
        const PAG = {};
        function pgState(key) { if (!PAG[key]) PAG[key] = { page: 1, perPage: 25 }; return PAG[key]; }
        function pgSlice(key, arr) {
            const st = pgState(key);
            const n = arr.length;
            const totalPages = st.perPage === 'All' ? 1 : Math.max(1, Math.ceil(n / st.perPage));
            if (st.page > totalPages) st.page = totalPages;
            if (st.page < 1) st.page = 1;
            const start = st.perPage === 'All' ? 0 : (st.page - 1) * st.perPage;
            const items = st.perPage === 'All' ? arr : arr.slice(start, start + st.perPage);
            return { items, start, totalPages, n };
        }
        function pgBar(key, meta) {
            const st = pgState(key);
            if (!meta.n) return '';
            const per = st.perPage;
            const from = per === 'All' ? (meta.n ? 1 : 0) : meta.start + 1;
            const to = per === 'All' ? meta.n : Math.min(meta.start + per, meta.n);
            const opts = PER_PAGE_OPTS.map(o => `<option value="${o}" ${String(per) === String(o) ? 'selected' : ''}>${o === 'All' ? 'Show all' : o + ' per page'}</option>`).join('');
            return `<div class="pg-bar" data-pgkey="${key}">
                <div class="pg-info">Showing <b>${from}–${to}</b> of <b>${meta.n}</b></div>
                <div class="pg-per-wrap"><label>Rows</label><select class="pg-per">${opts}</select></div>
                <div class="pg-btns">
                    <button class="btn btn-outline btn-sm" data-pg="prev" ${st.page <= 1 ? 'disabled' : ''}>&#9664; Prev</button>
                    <span class="pg-page">Page ${st.page} of ${meta.totalPages}</span>
                    <button class="btn btn-outline btn-sm" data-pg="next" ${st.page >= meta.totalPages ? 'disabled' : ''}>Next &#9654;</button>
                </div>
            </div>`;
        }

        function renderCurrentView() {
            if (viewportCleanup) { viewportCleanup(); viewportCleanup = null; }
            const appEl = document.getElementById('app');
            let html = "";
            switch (ROUTE.view) {
                case "home": html = viewHome(); break;
                case "jobs": html = viewJobs(); break;
                case "apply": html = viewApply(); break;
                case "confirmation": html = viewConfirmation(); break;
                case "status": html = viewStatus(); break;
                case "fees": html = viewFees(); break;
                case "login": html = viewLogin(); break;
                case "applicant-dashboard": html = viewApplicantDashboard(); break;
                case "admin-dashboard": html = viewAdminDashboard(); break;
                case "admin-jobs": html = viewAdminJobs(); break;
                case "admin-fees": html = viewAdminFees(); break;
                case "admin-finance": html = viewAdminFinance(); break;
                case "messages": html = viewMessages(); break;
                case "messages-chat": html = viewMessagesChat(); break;
                case "faq": html = viewFaq(); break;
                case "terms": html = viewTerms(); break;
                case "privacy": html = viewPrivacy(); break;
                case "about-demo": html = viewAboutDemo(); break;
                case "job-detail": html = viewJobDetail(); break;
                default: html = viewNotFound();
            }
            appEl.innerHTML = html + renderFooter();
            wireGlobalNav();
            if (ROUTE.view === "apply") wireApplyForm();
            if (ROUTE.view === "status") wireStatusForm();
            if (ROUTE.view === "login") wireLogin();
            if (ROUTE.view === "applicant-dashboard") wireApplicantDashboard();
            if (ROUTE.view === "admin-dashboard") wireAdminDashboard();
            if (ROUTE.view === "admin-jobs") wireAdminJobs();
            if (ROUTE.view === "admin-fees") wireAdminFees();
            if (ROUTE.view === "admin-finance") wireAdminFinance();
            if (ROUTE.view === "messages") wireMessages();
            if (ROUTE.view === "messages-chat") wireMessagesChat();
            if (ROUTE.view === "jobs") wireJobsFilters();
            if (ROUTE.view === "job-detail") wireJobDetail();
        }

        function wireGlobalNav() {
            document.querySelectorAll('[data-nav]').forEach(el => {
                el.addEventListener('click', () => {
                    const view = el.getAttribute('data-nav');
                    const jobid = el.getAttribute('data-jobid');
                    const country = el.getAttribute('data-country');
                    if (view === 'jobs' && country) { jobFilter = { country, category: "All" }; saveJobFilter(); }
                    navigate(view, jobid ? { jobid } : {});
                });
            });
            document.body.addEventListener('click', e => { const el = e.target.closest('[data-action="logout"]'); if (el) { e.preventDefault(); signOut(auth); } });
        }

        function renderFooter() {
            return `
          <footer>
            <div class="wrap">
              <div class="foot-grid">
                <div>
                  <div class="foot-brand"><span class="brand-mark"><i class="fa-solid fa-earth-europe"></i></span> Europe Sponsor Jobs</div>
                  <p style="font-size:13.5px;line-height:1.7;max-width:320px">Connecting global talent with verified European employers offering visa sponsorship — ethically, transparently, and free of charge to job seekers.</p>
                </div>
                <div>
                  <h5>Quick Links</h5>
                  <a data-nav="home">Home</a><a data-nav="jobs">Browse Jobs</a><a data-nav="status">Check Status</a><a data-nav="fees">Fees</a><a data-nav="faq">FAQ</a>
                </div>
                <div>
                  <h5>Contact</h5>
                  <a><i class="fa-solid fa-phone"></i> &nbsp;+254 143 350004</a>
                  <a><i class="fa-solid fa-envelope"></i> &nbsp;support@europesponsorjobs.com</a>
                  <a><i class="fa-solid fa-location-dot"></i> &nbsp;Nairobi &amp; Luxembourg City</a>
                </div>
                <div>
                  <h5>Legal</h5>
                  <a data-nav="terms">Terms &amp; Conditions</a><a data-nav="privacy">Privacy Policy</a><a data-nav="about-demo">About This Platform</a>
                </div>
              </div>
              <div class="foot-bottom">
                <span>© 2026 Europe Sponsor Jobs. All rights reserved.</span>
                <span>Ethical International Recruitment &amp; Visa Sponsorship</span>
              </div>
            </div>
          </footer>`;
        }

        function viewNotFound() {
            return `
          <section class="section">
            <div class="wrap" style="text-align:center;padding:60px 20px">
              <i class="fa-solid fa-compass" style="font-size:52px;color:var(--slate-300);margin-bottom:16px;display:block"></i>
              <h2 style="color:var(--blue-900);margin:0 0 8px">Page Not Found</h2>
              <p style="color:var(--slate-500);font-size:15px;margin:0 0 24px">The page you're looking for doesn't exist or has been moved.</p>
              <a class="btn btn-primary" data-nav="home"><i class="fa-solid fa-house"></i> Go Home</a>
            </div>
          </section>`;
        }

        function viewHome() {
            const jobs = allJobs;
            return `
          <section class="hero">
            <div class="wrap hero-inner">
              <div>
                <div class="eyebrow"><i class="fa-solid fa-shield-halved"></i> Licensed International Recruitment Agency</div>
                <h1>Connecting Global Talent with <em>European Visa Sponsorship</em> Opportunities</h1>
                <p class="lead">Europe Sponsor Jobs connects skilled and manual workers with verified European employers offering genuine visa sponsorship — from construction and hospitality to healthcare and engineering. Ethical, transparent, end-to-end support.</p>
                <div class="hero-actions">
                  ${currentUserData?.type === 'admin' ? `<a class="btn btn-maroon" data-nav="admin-dashboard"><i class="fa-solid fa-shield-halved"></i> Admin Dashboard</a>` : `<a class="btn btn-maroon" data-nav="apply"><i class="fa-solid fa-paper-plane"></i> Start Your Application</a>`}
                  <a class="btn btn-outline-light" data-nav="jobs"><i class="fa-solid fa-briefcase"></i> Browse ${Math.max(jobs.length, JOBS_SEED.length)} Roles</a>
                </div>
                <div class="hero-stats">
                  <div class="hero-stat"><b>${COUNTRIES.length}</b><span>Destination Countries</span></div>
                  <div class="hero-stat"><b>${Math.max(jobs.length, JOBS_SEED.length)}</b><span>Active Job Listings</span></div>
                  <div class="hero-stat"><b>0%</b><span>Placement Fee to Workers</span></div>
                </div>
              </div>
              <div class="stamp-panel">
                <h4><i class="fa-solid fa-route"></i> Your Journey, Tracked End-to-End</h4>
                <div class="steps-vertical">
                  ${[["Application Received","Our team receives and logs your submission"],["Documents Processing","Work permit docs, CV & cover letter prepared"],["Documents Review & Approval","All credentials reviewed and approved"],["Placement & Deployment","Employer matched, contract signed & travel arranged"]].map(([label,sub],i) => `
                  <div class="step-item">
                    <div class="step-line"></div>
                    <div class="step-dot ${i < 2 ? 'active' : 'pending'}">${i < 2 ? '<i class="fa-solid fa-check"></i>' : '<i class="fa-regular fa-clock"></i>'}</div>
                    <div class="step-content">
                      <div class="step-label">${label}</div>
                      <div class="step-sub">${sub}</div>
                    </div>
                  </div>`).join("")}
                </div>
                <p style="color:#B9C8DC;font-size:13px;margin-top:18px;line-height:1.6;padding-left:46px"><i class="fa-solid fa-circle-check" style="color:var(--maroon-400);margin-right:6px"></i>Real-time status updates &amp; personal portal for every applicant</p>
                <a class="btn btn-outline-light btn-block" data-nav="status" style="margin-top:14px"><i class="fa-solid fa-magnifying-glass"></i> Check Your Application Status</a>
              </div>
            </div>
          </section>

          <section class="section">
            <div class="wrap">
              <div class="section-head">
                <div class="eyebrow"><i class="fa-solid fa-earth-europe"></i> Destinations</div>
                <h2>Where We Place Talent</h2>
                <p>Every partner employer is vetted for legal compliance, genuine visa sponsorship, fair wages and safe working conditions.</p>
              </div>
              <div class="country-grid">${COUNTRIES.map(c => countryCard(c)).join("")}</div>
            </div>
          </section>

          <section class="section section-alt">
            <div class="wrap">
              <div class="section-head">
                <div class="eyebrow"><i class="fa-solid fa-layer-group"></i> Every Skill Level</div>
                <h2>From Manual Labor to Skilled Professionals</h2>
                <p>We recruit across the full spectrum of overseas job categories.</p>
              </div>
              <div class="why-grid">
                ${CATEGORIES.slice(0, 8).map(c => `
                  <div class="why-item"><div class="why-icon"><i class="${CATEGORY_ICON[c]}"></i></div><h4>${c}</h4></div>`).join("")}
              </div>
            </div>
          </section>

          <section class="section">
            <div class="wrap">
              <div class="section-head">
                <div class="eyebrow"><i class="fa-solid fa-route"></i> How It Works</div>
                <h2>Your Placement Journey</h2>
              </div>
              <div class="process-grid">
                ${["Apply Online","Document Review","Interview & Matching","Visa Sponsorship & Contract","Fly Out & Start Work"].map((t,i) => `
                  <div class="process-step">
                    <div class="process-num">STEP ${String(i+1).padStart(2,'0')}</div>
                    <h4>${t}</h4>
                    <p>${["Submit your details, CV and passport copy in minutes.","Our team verifies your documents and eligibility.","We match you to employers and arrange interviews.","Offer, contract signing and visa sponsorship begins.","We coordinate travel and confirm your first day."][i]}</p>
                  </div>`).join("")}
              </div>
            </div>
          </section>

          <section class="section" style="padding-top:0">
            <div class="wrap">
              <div class="trust-banner">
                <i class="fa-solid fa-hand-holding-heart"></i>
                <div>
                  <b>Our Ethical Recruitment Promise</b>
                  <p>Europe Sponsor Jobs never charges job seekers a placement fee, in line with ILO Fair Recruitment principles. Legitimate costs (visas, medicals) are disclosed up front and, where applicable, covered or advanced by the employer. Report any request for payment to our compliance team immediately.</p>
                </div>
              </div>
            </div>
          </section>

          <section class="section" style="background:var(--blue-900);color:#fff;text-align:center">
            <div class="wrap" style="max-width:640px">
              <h2 style="color:#fff;margin-bottom:12px">Ready to work in Europe?</h2>
              <p style="color:#B9C8DC;margin-bottom:26px">It takes less than 10 minutes to submit your application.</p>
              <a class="btn btn-maroon" data-nav="apply"><i class="fa-solid fa-paper-plane"></i> Apply Now</a>
            </div>
          </section>`;
        }

        function countryCard(country) {
            const meta = COUNTRY_META[country];
            const jobCount = countryJobCounts[country] || 0;
            const points = {
                "Germany": ["EU Blue Card visa sponsorship pathway", "Strong social security system", "Excellent economy", "Free education for children"],
                "United Kingdom": ["Skilled Worker visa sponsorship", "NHS healthcare access", "Strong worker rights", "Path to settlement"],
                "Netherlands": ["Highly Skilled Migrant visa route", "High quality of life", "English widely spoken", "Strong labor protections"],
                "Sweden": ["Clear work permit sponsorship route", "Excellent welfare system", "Path to permanent residency", "Family-friendly policies"],
                "Ireland": ["Critical Skills / General Employment permits", "English-speaking EU member", "Strong tech & healthcare sectors", "Path to residency"],
                "Luxembourg": ["EU labor standards & benefits", "High salary-to-cost-of-living ratio", "French / English support", "Excellent pension system"],
                "France": ["Talent Passport visa sponsorship", "Universal healthcare access", "Strong labor protections", "Rich cultural life"],
                "Poland": ["Fast-growing labor market", "EU work permit sponsorship", "Lower cost of living", "Central European access"]
            };
            const p = points[country] || ["Fair wages", "Safe working conditions", "Legal compliance", "Transparent process"];
            return `
            <div class="country-card">
              <div class="country-flagbar">
                <span><img class="flag-img" src="${flagUrl(meta.flag)}" alt="${country}" loading="lazy"> ${country}</span>
                <i class="fa-solid fa-arrow-right"></i>
              </div>
              <div class="country-body">
                <ul>${p.map(pt => `<li><i class="fa-solid fa-circle-check"></i> ${pt}</li>`).join("")}</ul>
                <div class="country-foot">
                  <span class="count">${jobCount} open role${jobCount === 1 ? '' : 's'}</span>
                  <a class="btn btn-outline btn-sm" data-nav="jobs" data-country="${esc(country)}">View Jobs</a>
                </div>
              </div>
            </div>`;
        }

        let jobFilter = { country: "All", category: "All" };

        function viewJobs() {
            const jobs = allJobs.filter(j =>
                (jobFilter.country === "All" || j.country === jobFilter.country) &&
                (jobFilter.category === "All" || j.category === jobFilter.category)
            );
            return `
          <section class="section" style="padding-top:38px">
            <div class="wrap">
              <div class="section-head" style="margin-bottom:26px">
                <div class="eyebrow"><i class="fa-solid fa-briefcase"></i> Open Roles</div>
                <h2>Browse Available Jobs</h2>
                <p>${allJobs.length} active listings across ${COUNTRIES.length} destination countries.</p>
              </div>
              <div class="filter-bar">
                ${["All", ...COUNTRIES].map(c => `<button class="chip ${jobFilter.country === c ? 'active' : ''}" data-country="${esc(c)}">${c === 'All' ? 'All Countries' : c}</button>`).join("")}
              </div>
              <div class="filter-bar">
                ${["All", ...CATEGORIES].map(c => `<button class="chip ${jobFilter.category === c ? 'active' : ''}" data-cat="${esc(c)}">${c}</button>`).join("")}
              </div>
              <div class="job-grid">
                ${allJobs.length === 0 ? `<div class="empty-state" style="grid-column:1/-1"><i class="fa-solid fa-spinner fa-spin"></i><p>Loading job listings &hellip;</p></div>` : jobs.length ? jobs.map(jobCard).join("") : `<div class="empty-state" style="grid-column:1/-1"><i class="fa-solid fa-inbox"></i><p>No roles match these filters right now.</p><span style="font-size:12px;color:var(--slate-400)">Try changing your selection above.</span></div>`}
              </div>
            </div>
          </section>`;
        }

        function jobCard(j) {
            const meta = COUNTRY_META[j.country] || {};
            return `
            <div class="job-card" data-jobid="${j.id}">
              <div class="jc-head">
                <div class="jc-icon"><i class="${CATEGORY_ICON[j.category]}"></i></div>
                <div class="jc-title-wrap">
                  <h4 class="jc-title">${esc(j.title)}</h4>
                  <div class="jc-salary">${esc(j.salary)}</div>
                </div>
              </div>
              <div class="jc-badges">
                <span class="badge badge-blue"><img src="${flagUrl(meta.flag)}" alt="" loading="lazy" style="width:15px;height:11px;border-radius:2px;display:inline-block;vertical-align:middle;margin-right:5px"> ${esc(j.country)}</span>
                <span class="badge badge-indigo">${esc(j.category)}</span>
              </div>
              <p class="jc-desc">${esc((j.desc || '').slice(0, 120))}${(j.desc || '').length > 120 ? '&hellip;' : ''}</p>
              <div class="jc-foot">
                <button class="btn btn-outline jc-view-btn" data-jobid="${j.id}"><i class="fa-regular fa-eye"></i> View Details</button>
                ${currentUserData?.type === 'admin' ? '' : `<a class="btn btn-primary" data-nav="apply" data-jobid="${j.id}">Apply Now <i class="fa-solid fa-arrow-right"></i></a>`}
              </div>
            </div>`;
        }

        function saveJobFilter() { try { sessionStorage.setItem('jobFilter', JSON.stringify(jobFilter)); } catch(e) {} }
        function restoreJobFilter() { try { const s = sessionStorage.getItem('jobFilter'); if (s) { const f = JSON.parse(s); if (f && typeof f === 'object') Object.assign(jobFilter, f); } } catch(e) {} }
        function wireJobsFilters() {
            document.querySelectorAll('[data-country]').forEach(b => b.addEventListener('click', () => { jobFilter.country = b.getAttribute('data-country'); saveJobFilter(); renderCurrentView(); }));
            document.querySelectorAll('[data-cat]').forEach(b => b.addEventListener('click', () => { jobFilter.category = b.getAttribute('data-cat'); saveJobFilter(); renderCurrentView(); }));
            document.querySelectorAll('.jc-view-btn').forEach(btn => btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const jobId = btn.getAttribute('data-jobid');
                if (jobId) navigate('job-detail', { jobId });
            }));
            document.querySelector('.job-grid')?.addEventListener('click', (e) => {
                const card = e.target.closest('.job-card');
                if (!card) return;
                if (e.target.closest('a, button, .btn, [data-nav], .jc-view-btn')) return;
                const jobId = card.getAttribute('data-jobid');
                if (jobId) navigate('job-detail', { jobId });
            });
        }
        function viewJobDetail() {
            const jobId = ROUTE.params.jobId;
            const job = allJobs.find(j => j.id === jobId);
            if (!job) return `<div class="section"><div class="wrap"><div class="empty-state" style="padding:80px 20px"><i class="fa-solid fa-briefcase-slash"></i><p>Job not found.</p><a class="btn btn-primary" data-nav="jobs">Browse Jobs</a></div></div></div>`;
            const meta = COUNTRY_META[job.country] || {};
            const cd = COUNTRY_DETAILS[job.country] || {};
            const benefits = cd.benefits || [];
            return `
            <section class="jd-section">
              <div class="jd-hero">
                <div class="wrap">
                  <button class="jd-back btn btn-outline btn-sm" data-nav="jobs"><i class="fa-solid fa-arrow-left"></i> All Jobs</button>
                  <div class="jd-hero-body">
                    <div class="jd-hero-icon"><i class="${CATEGORY_ICON[job.category]}"></i></div>
                    <div>
                      <h1 class="jd-title">${esc(job.title)}</h1>
                      <div class="jd-salary">${esc(job.salary)}</div>
                      <div class="jd-badges">
                        <span class="badge badge-blue"><img src="${flagUrl(meta.flag)}" alt="" loading="lazy" style="width:18px;height:13px;border-radius:2px;display:inline-block;vertical-align:middle;margin-right:6px"> ${esc(job.country)}</span>
                        <span class="badge badge-indigo">${esc(job.category)}</span>
                      </div>
                    </div>
                  </div>
                  <div class="jd-actions">
                    ${currentUserData?.type === 'admin' ? '' : `<a class="btn btn-primary btn-lg" data-nav="apply" data-jobid="${job.id}">Apply Now <i class="fa-solid fa-arrow-right"></i></a>`}
                    <button class="btn btn-outline btn-lg jd-share"><i class="fa-solid fa-share-nodes"></i> Share</button>
                  </div>
                </div>
              </div>
              <div class="wrap jd-body">
                <div class="jd-main">
                  <div class="jd-card">
                    <h2><i class="fa-solid fa-file-lines"></i> Job Description</h2>
                    <p>${esc(job.desc || 'No description provided.')}</p>
                  </div>
                  <div class="jd-card">
                    <h2><i class="fa-solid fa-gift"></i> Benefits &amp; Perks — ${esc(job.country)}</h2>
                    <div class="benefits-grid">
                      ${benefits.map(b => `
                      <div class="ben-item">
                        <div class="ben-icon"><i class="fa-solid fa-${b.icon}"></i></div>
                        <div class="ben-info">
                          <div class="ben-label">${b.label}</div>
                          <div class="ben-value">${b.value}</div>
                        </div>
                      </div>`).join("")}
                    </div>
                  </div>
                  <div class="jd-card">
                    <h2><i class="fa-solid fa-globe"></i> About ${esc(job.country)}</h2>
                    <p>${cd.overview || 'Information not available.'}</p>
                    ${cd.facts ? `<div class="jd-facts"><i class="fa-solid fa-star"></i> ${cd.facts}</div>` : ''}
                  </div>
                </div>
                <div class="jd-sidebar">
                  <div class="jd-card jd-sticky">
                    <h3>Quick Facts</h3>
                    <div class="qf-grid">
                      ${cd.minWage ? `<div class="qf-item"><span class="qf-label">Min Wage</span><span class="qf-val">${cd.minWage}</span></div>` : ''}
                      ${cd.employeeCount ? `<div class="qf-item"><span class="qf-label">Workforce</span><span class="qf-val">${cd.employeeCount}</span></div>` : ''}
                      <div class="qf-item"><span class="qf-label">Currency</span><span class="qf-val">${meta.currency || cd.currency || ''}</span></div>
                    </div>
                    <hr style="margin:16px 0;border:none;border-top:1px solid var(--slate-200)">
                    <h3>Quick Apply</h3>
                    <p style="font-size:14px;color:var(--slate-600);margin-bottom:14px">Ready to take the next step? Apply now and our team will get back to you.</p>
                    ${currentUserData?.type === 'admin' ? '' : `<a class="btn btn-primary btn-block" data-nav="apply" data-jobid="${job.id}">Apply Now <i class="fa-solid fa-arrow-right"></i></a>`}
                    <button class="btn btn-outline btn-block jd-share" style="margin-top:8px"><i class="fa-solid fa-share-nodes"></i> Share</button>
                  </div>
                </div>
              </div>
            </section>`;
        }

        function wireJobDetail() {
            document.querySelectorAll('.jd-share').forEach(btn => btn.addEventListener('click', () => {
                if (navigator.share) {
                    navigator.share({ title: document.title, url: window.location.href }).catch(() => {});
                } else {
                    navigator.clipboard.writeText(window.location.href).then(() => toast('Link copied!', 'ok')).catch(() => {});
                }
            }));
        }

        restoreJobFilter();

        function viewApply() {
            if (currentUserData?.type === 'admin') {
                return `<div class="section"><div class="wrap"><div class="empty-state"><i class="fa-solid fa-lock"></i><p>Admin accounts cannot apply for jobs. Use the <a data-nav="admin-dashboard" style="text-decoration:underline;color:var(--blue-700)">Admin Dashboard</a> to manage applications.</p><a class="btn btn-primary" data-nav="admin-dashboard">Go to Admin Dashboard</a></div></div></div>`;
            }
            const jobs = allJobs;
            const preselectJob = ROUTE.params.jobid || "";
            const byCountry = {};
            jobs.forEach(j => { byCountry[j.country] = byCountry[j.country] || []; byCountry[j.country].push(j); });
            return `
          <section class="section" style="padding-top:38px">
            <div class="wrap">
              <div class="section-head" style="margin-bottom:26px;max-width:720px">
                <div class="eyebrow"><i class="fa-solid fa-file-signature"></i> Application</div>
                <h2>Job Application Form</h2>
                <p>Fields marked <span class="req">*</span> are required. Your data is used only for recruitment purposes — see our <a data-nav="privacy" style="text-decoration:underline">Privacy Policy</a>.</p>
              </div>
              <div class="form-shell">
                <div class="card pad">
                  <form id="applyForm" novalidate>
                    <div class="field-row">
                      <div class="field"><label>Full Name (as on passport) <span class="req">*</span></label><input type="text" name="fullName" placeholder="Surname / First name / Middle names" required></div>
                      <div class="field"><label>Date of Birth <span class="req">*</span></label><input type="date" name="dob" required></div>
                    </div>
                    <div class="field-row">
                      <div class="field">
                        <label>Nationality <span class="req">*</span></label>
                        <div id="natSelectContainer"></div>
                      </div>
                      <div class="field">
                        <label>Phone Number <span class="req">*</span></label>
                        <div class="phone-wrapper">
                          <div id="phoneCodeContainer"></div>
                          <input type="tel" name="phone" placeholder="712 345 678" required>
                        </div>
                      </div>
                    </div>
                    <div class="field-row">
                      <div class="field"><label>Email Address <span class="req">*</span></label><input type="email" name="email" placeholder="you@example.com" required></div>
                      <div class="field"><label>Current Residential Address <span class="req">*</span></label><input type="text" name="address" placeholder="Street, City, Province, Postal Code" required></div>
                    </div>
                    <div class="field-row">
                      <div class="field"><label>Country of Residence <span class="req">*</span></label>
                        <select name="residence" required>
                          <option value="">Select Country</option>
                          ${NATIONALITIES.map(n => `<option value="${n.name}">${n.name}</option>`).join("")}
                        </select>
                      </div>
                      <div class="field"><label>City <span class="req">*</span></label><input type="text" name="city" placeholder="Your current city" required></div>
                    </div>
                    <div class="field-row">
                      <div class="field"><label>Education Level <span class="req">*</span></label>
                        <select name="education" required>
                          <option value="">Select Education Level</option>
                          ${EDUCATION_LEVELS.map(e => `<option>${e}</option>`).join("")}
                        </select>
                      </div>
                      <div class="field"><label>Job Interested In <span class="req">*</span></label>
                        <select name="jobId" id="jobSelect" required>
                          <option value="">Select a Job</option>
                          ${COUNTRIES.map(c => `<optgroup label="${c}">${(byCountry[c]||[]).map(j => `<option value="${j.id}" ${j.id === preselectJob ? 'selected' : ''}>${esc(j.title)} — ${esc(j.salary)}</option>`).join("")}</optgroup>`).join("")}
                        </select>
                      </div>
                    </div>
                    <div class="field">
                      <label>Work Experience <span class="req">*</span></label>
                      <textarea name="workExperience" placeholder="Describe your work history — employers, roles, duration, key responsibilities. Include relevant skills and achievements." required></textarea>
                    </div>
                    <div class="field-row">
                      <div class="field">
                        <label>CV / Resume (PDF, DOC, DOCX) <span class="req">*</span></label>
                        <div class="upload-box" id="cvBox">
                          <i class="fa-solid fa-cloud-arrow-up"></i>
                          <div class="u-title">Click to upload CV/Resume</div>
                          <div class="u-sub" id="cvSub">Upload via Uploadcare — PDF, DOC, DOCX</div>
                        </div>
                        <input type="hidden" id="cvUploaded" name="cvUrl" />
                      </div>
                      <div class="field">
                        <label>Passport Photo <span class="req">*</span></label>
                        <div class="upload-box" id="passBox">
                          <i class="fa-solid fa-cloud-arrow-up"></i>
                          <div class="u-title">Click to upload Passport Photo</div>
                          <div class="u-sub" id="passSub">Upload via Uploadcare — JPG, PNG</div>
                        </div>
                        <input type="hidden" id="passUploaded" name="passportUrl" />
                      </div>
                    </div>
                    <div class="field-row-3">
                      <div class="field">
                        <label>Certificates / Credentials</label>
                        <div class="upload-box" id="certBox">
                          <i class="fa-solid fa-cloud-arrow-up"></i>
                          <div class="u-title">Click to upload Certificates</div>
                          <div class="u-sub" id="certSub">Upload via Uploadcare</div>
                        </div>
                        <input type="hidden" id="certUploaded" name="certificatesUrl" />
                      </div>
                      <div class="field">
                        <label>Reference Letter</label>
                        <div class="upload-box" id="refBox">
                          <i class="fa-solid fa-cloud-arrow-up"></i>
                          <div class="u-title">Click to upload Reference</div>
                          <div class="u-sub" id="refSub">Upload via Uploadcare</div>
                        </div>
                        <input type="hidden" id="refUploaded" name="referenceUrl" />
                      </div>
                      <div class="field">
                        <label>Medical Report (if available)</label>
                        <div class="upload-box" id="medBox">
                          <i class="fa-solid fa-cloud-arrow-up"></i>
                          <div class="u-title">Click to upload Medical Report</div>
                          <div class="u-sub" id="medSub">Upload via Uploadcare</div>
                        </div>
                        <input type="hidden" id="medUploaded" name="medicalUrl" />
                      </div>
                    </div>
                    <div class="field-row">
                      <div class="field"><label>Passport Number <span class="req">*</span></label><input type="text" name="passportNumber" placeholder="e.g. AB1234567" required></div>
                      <div class="field" id="passwordField"><label>${currentUser?'Confirm':'Create'} Password <span class="req">*</span></label><input type="password" name="password" placeholder="Minimum 6 characters" required minlength="6"></div>
                    </div>
                    <div class="field">
                      <label>Cover Letter / Message (Optional)</label>
                      <textarea name="cover" placeholder="Write your cover letter or additional message here..."></textarea>
                    </div>
                    <div class="field">
                      <label class="checkbox-row"><input type="checkbox" name="terms" required> I agree to the <a data-nav="terms" style="text-decoration:underline">Terms &amp; Conditions</a> and consent to the processing of my personal data for recruitment purposes, in accordance with the <a data-nav="privacy" style="text-decoration:underline">Privacy Policy</a>.</label>
                    </div>
                    <button type="submit" class="btn btn-primary btn-block"><i class="fa-solid fa-paper-plane"></i> Submit Application</button>
                  </form>
                </div>
                <div>
                  <div class="card pad tip-card" style="margin-bottom:18px">
                    <h4 style="margin:0 0 14px;font-size:14px;color:var(--blue-900)"><i class="fa-solid fa-circle-info" style="color:var(--blue-700)"></i> Application Tips</h4>
                    <ul>
                      <li><i class="fa-solid fa-check"></i> Ensure all fields are correctly filled</li>
                      <li><i class="fa-solid fa-check"></i> Upload CV in PDF or Word format</li>
                      <li><i class="fa-solid fa-check"></i> Passport photo must be clear and legible</li>
                      <li><i class="fa-solid fa-check"></i> Double-check your contact information</li>
                      <li><i class="fa-solid fa-check"></i> Save your Application ID for tracking</li>
                    </ul>
                  </div>
                  <div class="card pad">
                    <h4 style="margin:0 0 14px;font-size:14px;color:var(--blue-900)"><i class="fa-solid fa-shield-halved" style="color:var(--emerald-600)"></i> No Fees to Apply</h4>
                    <p style="font-size:13px;color:var(--slate-600);margin:0">Europe Sponsor Jobs never charges job seekers to apply, interview, or be placed. Never send money to anyone claiming to guarantee a job.</p>
                  </div>
                </div>
              </div>
            </div>
          </section>`;
        }

        function wireApplyForm() {
            // If user is logged in, hide password field and fill known info
            const pwField=document.getElementById('passwordField');
            if(currentUser){
                if(pwField)pwField.style.display='none';
                const emailField=document.querySelector('input[name="email"]');
                const nameField=document.querySelector('input[name="fullName"]');
                if(emailField&&currentUser.email)emailField.value=currentUser.email;
                if(nameField&currentUser.displayName)nameField.value=currentUser.displayName;
                document.querySelector('input[type="password"]')?.removeAttribute('required');
            }else{
                if(pwField)pwField.style.display='';
            }
            const cvBox = document.getElementById('cvBox');
            const passBox = document.getElementById('passBox');
            if (!cvBox) return;

            const phoneOptions = NATIONALITIES.filter(n => n.dial !== "+0").map(n => ({ value: n.dial, label: n.code + " " + n.dial, flag: n.flag, sublabel: n.name }));
            const phoneSearch = new SearchableSelect({
                container: document.getElementById('phoneCodeContainer'),
                name: 'phoneCode',
                options: phoneOptions,
                placeholder: 'Code'
            });
            const natOptions = NATIONALITIES.map(n => ({ value: n.code, label: n.name, flag: n.flag }));
            const natSearch = new SearchableSelect({
                container: document.getElementById('natSelectContainer'),
                name: 'nationality',
                options: natOptions,
                placeholder: 'Select Nationality',
                onChange(val) {
                    const nat = NATIONALITIES.find(n => n.code === val);
                    if (nat && nat.dial && nat.dial !== '+0') {
                        phoneSearch.setValue(nat.dial);
                    }
                }
            });

            const certBox = document.getElementById('certBox');
            const refBox = document.getElementById('refBox');
            const medBox = document.getElementById('medBox');

            // Shared upload box: shows an uploading state while the file uploads,
            // then a preview thumbnail + Preview/Replace controls once done.
            function makeUploadBox(box, hiddenId, subId, accept, label) {
                if (!box) return;
                const hidden = document.getElementById(hiddenId);
                const sub = document.getElementById(subId);
                let busy = false;
                let currentUrl = hidden?.value || '';
                const icon = box.querySelector('i');
                const title = box.querySelector('.u-title');

                function setUploading() {
                    busy = true;
                    box.classList.remove('filled');
                    box.classList.add('uploading');
                    box.setAttribute('data-busy', '1');
                    if (icon) icon.className = 'fa-solid fa-spinner fa-spin';
                    if (title) title.textContent = 'Uploading — please wait...';
                    if (sub) sub.textContent = 'Securely uploading to storage';
                }
                function setReady(info) {
                    busy = false;
                    box.removeAttribute('data-busy');
                    currentUrl = info.cdnUrl;
                    if (hidden) hidden.value = currentUrl;
                    box.classList.remove('uploading');
                    box.classList.add('filled');
                    if (icon) icon.className = 'fa-solid fa-circle-check';
                    if (title) title.textContent = (info.name || 'Document') + ' — ready';
                    if (sub) sub.textContent = info.name || 'Uploaded';
                    renderPreview();
                }
                function setError() {
                    busy = false;
                    box.removeAttribute('data-busy');
                    box.classList.remove('filled', 'uploading');
                    if (icon) icon.className = 'fa-solid fa-cloud-arrow-up';
                    if (title) title.textContent = 'Upload failed — tap to retry';
                    if (sub) sub.textContent = 'Click to try again';
                }
                function openPicker() {
                    if (busy) return;
                    const dialog = uploadcare.openDialog(null, { publicKey: UPLOADCARE_PUBLIC_KEY, multiple: false, imgOnly: false, accept });
                    dialog.done((file) => {
                        setUploading();
                        file.promise().then((info) => { validateFileSize(10)(info)
                            setReady(info);
                            toast((label || 'Document') + ' uploaded successfully!', 'ok');
                        }).catch((e) => {
                            console.error("Upload error:", e);
                            setError();
                            toast((e && e.message) || 'Upload failed.', 'err');
                        });
                    });
                    dialog.fail(() => { if (!busy) toast('Upload cancelled.', 'err'); });
                }
                function renderPreview() {
                    if (!currentUrl) return;
                    let prev = box.querySelector('.upload-preview');
                    if (!prev) { prev = document.createElement('div'); prev.className = 'upload-preview'; box.appendChild(prev); }
                    const isImg = /\.(jpg|jpeg|png|gif|webp|bmp)(\?.*)?$/i.test(currentUrl);
                    const isPdf = /\.pdf(\?.*)?$/i.test(currentUrl);
                    prev.innerHTML = isImg
                        ? `<img src="${currentUrl}" alt="${esc(label || '')}" loading="lazy">`
                        : `<span class="up-file-icon"><i class="fa-solid ${isPdf ? 'fa-file-pdf' : 'fa-file'}"></i></span>`;
                    let acts = box.querySelector('.upload-actions');
                    if (!acts) { acts = document.createElement('div'); acts.className = 'upload-actions'; box.appendChild(acts); }
                    acts.innerHTML = `
                        <button type="button" class="btn btn-outline btn-sm" data-up-preview="${esc(currentUrl)}" data-up-label="${esc(label || '')}"><i class="fa-solid fa-eye"></i> Preview</button>
                        <button type="button" class="btn btn-outline btn-sm" data-up-replace="1"><i class="fa-solid fa-rotate"></i> Replace</button>`;
                    box.querySelectorAll('[data-up-preview]').forEach(b => b.addEventListener('click', (e) => {
                        e.stopPropagation();
                        showDocPreviewModal(b.getAttribute('data-up-preview'), b.getAttribute('data-up-label') || 'Document');
                    }));
                    box.querySelectorAll('[data-up-replace]').forEach(b => b.addEventListener('click', (e) => {
                        e.stopPropagation();
                        openPicker();
                    }));
                }
                if (currentUrl) { box.classList.add('filled'); renderPreview(); }
                box.addEventListener('click', () => openPicker());
            }
            makeUploadBox(cvBox, 'cvUploaded', 'cvSub', 'application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'CV / Resume');
            makeUploadBox(passBox, 'passUploaded', 'passSub', 'image/jpeg,image/png', 'Passport Photo');
            makeUploadBox(certBox, 'certUploaded', 'certSub', 'application/pdf,image/jpeg,image/png', 'Certificates');
            makeUploadBox(refBox, 'refUploaded', 'refSub', 'application/pdf,image/jpeg,image/png', 'Reference Letter');
            makeUploadBox(medBox, 'medUploaded', 'medSub', 'application/pdf,image/jpeg,image/png', 'Medical Report');

            document.getElementById('applyForm').addEventListener('submit', async (e) => {
                e.preventDefault();
                const btn = e.target.querySelector('button[type="submit"]');
                if (btn?.disabled) return;
                if (currentUserData?.type === 'admin') { toast("Admin accounts cannot apply for jobs.", "err"); return; }
                const fd = new FormData(e.target);
                const fullName = fd.get('fullName').trim();
                const dob = fd.get('dob');
                const nationality = fd.get('nationality');
                const phoneCode = fd.get('phoneCode');
                const phone = fd.get('phone').trim();
                const email = fd.get('email').trim();
                const address = fd.get('address').trim();
                const residence = fd.get('residence');
                const city = fd.get('city').trim();
                const education = fd.get('education');
                const workExperience = fd.get('workExperience').trim();
                const jobId = fd.get('jobId');
                const passportNumber = fd.get('passportNumber').trim();
                const cover = fd.get('cover').trim();
                const password = fd.get('password');
                const terms = fd.get('terms');
                const cvUrl = fd.get('cvUrl');
                const passportUrl = fd.get('passportUrl');
                const certificatesUrl = fd.get('certificatesUrl');
                const referenceUrl = fd.get('referenceUrl');
                const medicalUrl = fd.get('medicalUrl');

                if (!fullName || !dob || !nationality || !phone || !email || !address || !residence || !city || !education || !workExperience || !jobId || !passportNumber) {
                    toast("Please complete all required fields.", "err"); return;
                }
                if (!/^\S+@\S+\.\S+$/.test(email)) { toast("Please enter a valid email address.", "err"); return; }
                if (!cvUrl) { toast("Please upload your CV/Resume.", "err"); return; }
                if (!passportUrl) { toast("Please upload your Passport photo.", "err"); return; }
                if (!currentUser && (!password || password.length < 6)) { toast("Password must be at least 6 characters.", "err"); return; }
                if (!terms) { toast("Please accept the Terms & Conditions to continue.", "err"); return; }

                const natObj = NATIONALITIES.find(n => n.code === nationality);
                const fullPhone = `${phoneCode} ${phone}`;

                if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Submitting...'; }
                try {
                    let user = currentUser;
                    let isNewAccount = false;
                    if (!user) {
                        const userCred = await createUserWithEmailAndPassword(auth, email, password);
                        user = userCred.user;
                        await updateProfile(user, { displayName: fullName });
                        isNewAccount = true;
                    }
                    const job = allJobs.find(j => j.id === jobId);
                    const appData = {
                        uid: user.uid, fullName, dob, nationality: natObj ? natObj.name : nationality,
                        nationalityCode: nationality, phone: fullPhone, phoneCode, phoneNumber: phone,
                        email, address, residence, city, education, workExperience, jobId,
                        jobTitle: job ? job.title : '', coverLetter: cover, cvUrl, passportUrl,
                        passportNumber, country: job ? job.country : '',
                        status: "Application Received",
                        documentStatus: { cv: cvUrl ? "pending_review" : "not_uploaded", passport: passportUrl ? "pending_review" : "not_uploaded", certificates: certificatesUrl ? "pending_review" : "not_uploaded", reference: referenceUrl ? "pending_review" : "not_uploaded", medical: medicalUrl ? "pending_review" : "not_uploaded" },
                        certificatesUrl: certificatesUrl || '',
                        referenceUrl: referenceUrl || '',
                        medicalUrl: medicalUrl || '',
                        timeline: [{ status: "Application Received", date: new Date().toISOString(), note: "Application submitted via the Europe Sponsor Jobs website." }],
                        internalNotes: [], fees: [], archived: false
                    };
                    const formattedAppId = genAppId();
                    appData.appId = formattedAppId;
                    appData.id = formattedAppId;
                    appData.uid = user.uid;
                    const appRef = doc(db, "applications", formattedAppId);
                    await setDoc(appRef, {
                        ...appData,
                        createdAt: serverTimestamp(),
                        updatedAt: serverTimestamp(),
                    });
                    const appId = formattedAppId;
                    simulateEmail(email, "Application Received – Europe Sponsor Jobs",
                        `Dear ${fullName},\n\nThank you for applying with Europe Sponsor Jobs.\n\nYour Application ID: ${formattedAppId}\nFull Name: ${fullName}\nNationality: ${natObj ? natObj.name : nationality}\nJob: ${job ? job.title : ''}\nCountry: ${job ? job.country : ''}\n\nYou can check your status anytime by logging into your portal.\n\nBest regards,\nEurope Sponsor Jobs Team`);
                    currentUserData = { ...appData, type: 'applicant' };
                    toast(`Application submitted! Your ID: ${formattedAppId}`, 'ok');
                    allApps.push({ id: appId, ...appData });
                    loadApps();
                    navigate("confirmation", { appId: appId });
                } catch (error) {
                    console.error("Application error:", error);
                    toast(error.message || "Failed to submit application. Please try again.", "err");
                } finally {
                    if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fa-solid fa-paper-plane"></i> Submit Application'; }
                }
            });
        }

        function viewConfirmation() {
            const appId = ROUTE.params.appId;
            const found = allApps.find(a => a.id === appId || a.uid === appId || a.appId === appId);
            if (!found) return `<div class="section"><div class="wrap"><div class="empty-state"><i class="fa-solid fa-triangle-exclamation"></i><p>Application not found.</p></div></div></div>`;
            return `
          <section class="section" style="padding-top:56px">
            <div class="wrap" style="max-width:600px">
              <div class="card pad" style="text-align:center">
                <div style="width:64px;height:64px;border-radius:50%;background:var(--emerald-50);color:var(--emerald-600);display:flex;align-items:center;justify-content:center;font-size:26px;margin:0 auto 18px"><i class="fa-solid fa-check"></i></div>
                <h2 style="margin:0 0 8px;color:var(--blue-900)">Application Submitted!</h2>
                <p style="color:var(--slate-500);margin:0 0 22px">Thank you, ${esc(found.fullName)}. Save your Application ID below — you'll need it to log in to your portal.</p>
                <div style="background:var(--slate-100);border-radius:10px;padding:16px;font-family:var(--font-head);font-size:22px;font-weight:800;color:var(--blue-900);letter-spacing:.03em;margin-bottom:22px">${displayId(found)}</div>
                <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap">
                  <a class="btn btn-primary" data-nav="applicant-dashboard"><i class="fa-solid fa-user"></i> Go to My Portal</a>
                  <a class="btn btn-outline" data-nav="status"><i class="fa-solid fa-magnifying-glass"></i> Check Status Page</a>
                </div>
              </div>
            </div>
          </section>`;
        }

        function viewStatus() {
            const found = ROUTE.params.found;
            return `
          <section class="section" style="padding-top:44px">
            <div class="wrap" style="max-width:700px">
              <div class="section-head" style="margin-bottom:26px">
                <div class="eyebrow"><i class="fa-solid fa-magnifying-glass"></i> Application Status</div>
                <h2>Check Your Application</h2>
                <p>Enter your Application ID or the email you applied with.</p>
              </div>
              <div class="card pad" style="margin-bottom:26px">
                <form id="statusForm" style="display:flex;gap:10px;flex-wrap:wrap">
                  <input type="text" id="statusQuery" placeholder="Application ID or Email" style="flex:1;min-width:220px">
                  <button class="btn btn-primary" type="submit"><i class="fa-solid fa-magnifying-glass"></i> Check Status</button>
                </form>
              </div>
              ${Array.isArray(found) ? found.map(a => renderStatusResult(a)).join('<div style="height:16px"></div>') : (found ? renderStatusResult(found) : found === false ? `<div class="empty-state"><i class="fa-solid fa-circle-exclamation"></i><p>No application found matching that ID or email.</p></div>` : "")}
            </div>
          </section>`;
        }

        function renderStatusResult(app) {
            return `
            <div class="card pad">
              <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:12px;margin-bottom:20px">
                <div>
                  <div style="font-size:12px;color:var(--slate-500);font-weight:700;letter-spacing:.03em">${displayId(app)}</div>
                  <h3 style="margin:4px 0 4px;color:var(--blue-900)">${esc(app.fullName)}</h3>
                  <div style="font-size:13.5px;color:var(--slate-500)">${esc(app.jobTitle)} · ${esc(app.country)}</div>
                </div>
                ${statusBadge(app.status)}
              </div>
              ${renderTimeline(app)}
            </div>`;
        }

        function renderTimeline(app) {
            const timeline = app.timeline || [];
            const isTerminalAlt = TERMINAL_ALT.includes(app.status);
            const items = timeline.slice().sort((a, b) => new Date(a.date) - new Date(b.date));
            return `<div class="timeline">
            ${items.map((t,i) => {
              const isLast = i === items.length - 1;
              const cls = TERMINAL_ALT.includes(t.status) ? 'rejected' : (isLast ? (isTerminalAlt ? '' : 'current') : 'done');
              const iconDone = cls === 'done' ? '<i class="fa-solid fa-check"></i>' : cls === 'rejected' ? '<i class="fa-solid fa-xmark"></i>' : '';
              return `<div class="tl-item ${cls}">
                <div class="tl-dot">${iconDone}</div>
                <div class="tl-title">${esc(t.status)}</div>
                <div class="tl-date">${fmtDate(t.date)}</div>
                ${t.note ? `<div class="tl-note">${esc(t.note)}</div>` : ''}
              </div>`;
            }).join("")}
            ${!isTerminalAlt && items.length < STATUS_STEPS.length ? `
              <div class="tl-item">
                <div class="tl-dot"></div>
                <div class="tl-title" style="color:var(--slate-400)">${esc(STATUS_STEPS[items.length] || "")}</div>
                <div class="tl-date">Upcoming</div>
              </div>` : ""}
          </div>`;
        }

        function wireStatusForm() {
            const f = document.getElementById('statusForm');
            if (!f) return;
            f.addEventListener('submit', async (e) => {
                e.preventDefault();
                const btn = f.querySelector('button[type="submit"]');
                if (btn?.disabled) return;
                const q = document.getElementById('statusQuery').value.trim().toLowerCase();
                if (!q) { toast("Please enter an Application ID or email.", "err"); return; }
                if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Searching...'; }
                try {
                    let matches = allApps.filter(a => (a.id && a.id.toLowerCase() === q) || (a.uid && a.uid.toLowerCase() === q) || (a.appId && a.appId.toLowerCase() === q) || (a.email && a.email.toLowerCase() === q));
                    if (matches.length === 0) {
                        try { const docSnap = await getDoc(doc(db, "applications", q)); if (docSnap.exists()) matches = [{ id: docSnap.id, ...docSnap.data() }]; } catch (e) {}
                    }
                    if (matches.length === 0) {
                        try { const qSnap = await getDocs(query(collection(db,"applications"),where("appId","==",q))); qSnap.forEach(d => matches.push({ id: d.id, ...d.data() })); } catch (e) {}
                    }
                    if (matches.length === 0) { navigate("status", { found: false }); return; }
                    navigate("status", { found: matches.length === 1 ? matches[0] : matches });
                } finally {
                    if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fa-solid fa-magnifying-glass"></i> Check Status'; }
                }
            });
        }

        function viewFees() {
            const fees = allFees;
            return `
          <section class="section" style="padding-top:44px">
            <div class="wrap">
              <div class="section-head">
                <div class="eyebrow"><i class="fa-solid fa-coins"></i> Transparent Pricing</div>
                <h2>Service Fee Structure</h2>
                <p>Europe Sponsor Jobs is committed to full transparency. All costs are disclosed clearly — no hidden charges.</p>
              </div>
              <div class="fee-grid">
                ${fees.length ? fees.map(f => `
                  <div class="fee-card ${f.paidBy === 'Employer' ? 'paid-by-employer' : ''}">
                    <div class="fee-icon"><i class="fa-solid fa-file-invoice"></i></div>
                    <div class="fee-amount">${esc(f.amount)}</div>
                    <div class="fee-label">${esc(f.label)}</div>
                    <div class="fee-desc">${esc(f.desc || '')}</div>
                    <div style="margin-top:10px;font-size:11px;font-weight:700;color:var(--slate-500)">Paid by: ${esc(f.paidBy)}</div>
                  </div>`).join("") : `<div class="empty-state" style="grid-column:1/-1"><i class="fa-solid fa-coins"></i><p>No fee items added yet.</p></div>`}
              </div>
              <div class="trust-banner" style="margin-top:32px">
                <i class="fa-solid fa-shield-halved"></i>
                <div>
                  <b>Our Commitment</b>
                  <p>We believe in ethical recruitment. Job seekers are never charged placement fees. Any legitimate third-party costs (visa fees, medicals) are disclosed in writing before you are asked to pay, and are often covered or advanced by the employer.</p>
                </div>
              </div>
            </div>
          </section>`;
        }

        let loginMode = "signin";

        function viewLogin() {
            return `
          <div class="auth-shell">
            <div class="card">
              <div class="pad" style="padding-bottom:0">
                <div class="auth-icon"><i class="fa-solid fa-user-lock"></i></div>
                <h2 style="margin:0 0 4px;color:var(--blue-900)">${loginMode === 'signin' ? 'Welcome Back' : 'Create Your Account'}</h2>
                <p style="color:var(--slate-500);font-size:13.5px;margin:0 0 20px">${loginMode === 'signin' ? 'Sign in to track your application or manage the platform.' : 'Register to start your European job application.'}</p>
              </div>
              <div class="pad" style="padding-top:0">
                <button class="btn btn-google btn-block" id="googleLoginBtn"><i class="fa-brands fa-google"></i> ${loginMode === 'signin' ? 'Continue with Google' : 'Sign up with Google'}</button>
                <div class="divider-or">or ${loginMode === 'signin' ? 'sign in with' : 'register with'} email</div>
                <form id="loginForm">
                  <div class="field"><label>Email <span class="req">*</span></label><input type="email" name="email" placeholder="you@example.com" required></div>
                  <div class="field"><label>Password <span class="req">*</span></label><input type="password" name="password" placeholder="Minimum 6 characters" required minlength="6"></div>
                  ${loginMode === 'register' ? `<div class="field"><label>Full Name <span class="req">*</span></label><input type="text" name="fullName" placeholder="Your full name" required></div>` : ''}
                  <button class="btn btn-primary btn-block" type="submit">${loginMode === 'signin' ? '<i class="fa-solid fa-right-to-bracket"></i> Sign In' : '<i class="fa-solid fa-user-plus"></i> Create Account'}</button>
                </form>
                <p class="hint" style="text-align:center;margin-top:14px">
                  ${loginMode === 'signin' ? `Don't have an account? <a style="text-decoration:underline;font-weight:600;cursor:pointer" id="switchToRegister">Sign up here</a>` : `Already have an account? <a style="text-decoration:underline;font-weight:600;cursor:pointer" id="switchToSignIn">Sign in</a>`}
                </p>
              </div>
            </div>
          </div>`;
        }

        function wireLogin() {
            const gBtn = document.getElementById('googleLoginBtn');
            if (gBtn) gBtn.addEventListener('click', async () => {
                if (gBtn.disabled) return;
                gBtn.disabled = true; gBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Signing in...';
                try {
                    const result = await signInWithPopup(auth, googleProvider);
                    const uid = result.user.uid;
                    const isAdmin = await getAdminUser(uid);
                    if (!isAdmin) {
                        const existing = await getApp(uid);
                        if (!existing) {
                            await setDoc(doc(db, "applications", uid), {
                                uid, fullName: result.user.displayName || '', email: result.user.email,
                                role: 'applicant', status: "No Application",
                                timeline: [], internalNotes: [], fees: [], archived: false,
                                createdAt: serverTimestamp(), updatedAt: serverTimestamp()
                            }).catch(() => {});
                        }
                    }
                    toast("Signed in with Google!", "ok");
                } catch (error) {
                    toast(error.message || "Google sign-in failed.", "err");
                } finally {
                    gBtn.disabled = false; gBtn.innerHTML = '<i class="fa-brands fa-google"></i> Sign in with Google';
                }
            });
            const lf = document.getElementById('loginForm');
            if (lf) lf.addEventListener('submit', async (e) => {
                e.preventDefault();
                const btn = lf.querySelector('button[type="submit"]');
                if (btn?.disabled) return;
                if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Please wait...'; }
                const fd = new FormData(e.target);
                const email = fd.get('email').trim();
                const password = fd.get('password');
                try {
                    if (loginMode === 'register') {
                        const fullName = fd.get('fullName').trim();
                        if (!fullName) { toast("Please enter your full name.", "err"); if (btn) { btn.disabled = false; btn.innerHTML = 'Create Account'; } return; }
                        const cred = await createUserWithEmailAndPassword(auth, email, password);
                        const uid = cred.user.uid;
                        await updateProfile(cred.user, { displayName: fullName });
                        await setDoc(doc(db, "applications", uid), {
                            uid, fullName, email, role: 'applicant', status: "No Application",
                            timeline: [], internalNotes: [], fees: [], archived: false,
                            createdAt: serverTimestamp(), updatedAt: serverTimestamp()
                        });
                        toast("Account created! Welcome.", "ok");
                    } else {
                        await signInWithEmailAndPassword(auth, email, password);
                        toast("Signed in successfully!", "ok");
                    }
                } catch (error) {
                    const code = error.code || '';
                    const msg = code === 'auth/user-not-found' ? 'No account found with this email.'
                        : code === 'auth/wrong-password' || code === 'auth/invalid-credential' ? 'Incorrect password.'
                        : code === 'auth/email-already-in-use' ? 'An account with this email already exists.'
                        : code === 'auth/too-many-requests' ? 'Too many attempts. Please try again later.'
                        : code === 'auth/weak-password' ? 'Password must be at least 6 characters.'
                        : error.message || 'Something went wrong.';
                    toast(msg, "err");
                } finally {
                    if (btn) { btn.disabled = false; btn.innerHTML = loginMode === 'register' ? 'Create Account' : 'Sign In'; }
                }
            });
            document.getElementById('switchToRegister')?.addEventListener('click', () => { loginMode = 'register'; window.scrollTo({ top: 0 }); renderCurrentView(); });
            document.getElementById('switchToSignIn')?.addEventListener('click', () => { loginMode = 'signin'; window.scrollTo({ top: 0 }); renderCurrentView(); });
        }

        


        function viewApplicantDashboard() {
            if (!currentUser) {
                return `<div class="section"><div class="wrap"><div class="empty-state"><i class="fa-solid fa-lock"></i><p>Please log in to view your dashboard.</p><a class="btn btn-primary" data-nav="login">Log In</a></div></div></div>`;
            }
            if (!currentUserData || currentUserData.type !== 'applicant') {
                const checkUid = currentUser?.uid;
                const appsFromAll = checkUid ? allApps.filter(a => a.uid === checkUid || a.id === checkUid) : [];
                if (appsFromAll.length > 0) {
                    currentUserData = { ...appsFromAll[0], type: 'applicant', allApps: appsFromAll };
                } else {
                    const isAdmin = currentUserData?.type === 'admin';
                    return `
              <div class="dash-shell">
                <div class="dash-side">
                  <div class="side-title">My Portal</div>
                  <a class="side-link active"><i class="fa-solid fa-gauge"></i> Application Overview</a>
                  ${isAdmin ? `<a class="side-link" data-nav="admin-dashboard"><i class="fa-solid fa-shield-halved"></i> Admin Dashboard</a>` : `<a class="side-link" data-nav="jobs"><i class="fa-solid fa-briefcase"></i> Browse Jobs</a>`}
                  <a class="side-link" data-nav="faq"><i class="fa-solid fa-circle-question"></i> FAQ</a>
                  <div class="side-title" style="margin-top:20px">Account</div>
                  <a class="side-link" data-action="logout"><i class="fa-solid fa-right-from-bracket"></i> Log Out</a>
                </div>
                <div class="dash-main">
                  <div class="dash-topbar">
                    <h2>Welcome, ${esc(currentUser.displayName || currentUser.email || 'User')}</h2>
                  </div>
                  <div class="card pad" style="text-align:center;padding:50px 30px">
                    ${isAdmin ? `
                    <i class="fa-solid fa-shield-halved" style="font-size:48px;color:var(--maroon-400);margin-bottom:16px"></i>
                    <h3 style="margin:0 0 8px;color:var(--blue-900)">Admin Account</h3>
                    <p style="color:var(--slate-500);max-width:400px;margin:0 auto 20px">You are logged in as an administrator. Admin accounts cannot submit job applications. Use the Admin Dashboard to manage applicants and listings.</p>
                    <a class="btn btn-primary" data-nav="admin-dashboard"><i class="fa-solid fa-shield-halved"></i> Go to Admin Dashboard</a>
                    ` : `
                    <i class="fa-solid fa-file-circle-plus" style="font-size:48px;color:var(--maroon-400);margin-bottom:16px"></i>
                    <h3 style="margin:0 0 8px;color:var(--blue-900)">No Application Yet</h3>
                    <p style="color:var(--slate-500);max-width:400px;margin:0 auto 20px">You haven't submitted an application. Browse available sponsored job opportunities in Europe and start your journey.</p>
                    <a class="btn btn-primary" data-nav="jobs"><i class="fa-solid fa-magnifying-glass"></i> Browse Jobs</a>
                    `}
                  </div>
                </div>
              </div>`;
                }
            }
            const uid = currentUser?.uid;
            const userApps = uid ? allApps.filter(a => a.uid === uid || a.id === uid) : [];
            const selectedAppId = ROUTE.params.appId || (userApps.length ? userApps[0].id : null) || currentUserData?.id;
            const app = userApps.find(a => a.id === selectedAppId || a.appId === selectedAppId) || userApps[0] || currentUserData;
            if (!app) {
                return `<div class="section"><div class="wrap"><div class="empty-state"><i class="fa-solid fa-inbox"></i><p>No applications found.</p><a class="btn btn-primary" data-nav="jobs">Browse Jobs</a></div></div></div>`;
            }
            const unread = getUnreadCount();
            const fields = ['fullName','dob','nationality','phone','email','address','city','education','jobId','passportNumber'];
            const filled = fields.filter(f => app[f]).length;
            const pct = Math.round((filled / fields.length) * 100);
            const appFees = app.fees||[];
            const totalOwed = appFees.reduce((s,f)=>{const p=parseAmountKES(f.amount);return s+p.kes},0);
            const totalPaid = appFees.filter(f=>f.paid).reduce((s,f)=>{const p=parseAmountKES(f.amount);return s+p.kes},0);
            const curStageIdx = STATUS_STEPS.indexOf(app.status);
            const isTerminal = TERMINAL_ALT.includes(app.status);
            return `
          <div class="dash-shell">
            <div class="dash-side">
              <div class="side-title">My Portal</div>
              <a class="side-link active"><i class="fa-solid fa-gauge"></i> Application Overview</a>
              <a class="side-link" data-nav="messages"><i class="fa-solid fa-comment-dots"></i> Messages${unread ? ` <span class="msg-count">${unread}</span>` : ''}</a>
              <a class="side-link" data-nav="jobs"><i class="fa-solid fa-briefcase"></i> Browse More Jobs</a>
              <a class="side-link" data-nav="apply"><i class="fa-solid fa-plus-circle"></i> New Application</a>
              <a class="side-link" data-nav="faq"><i class="fa-solid fa-circle-question"></i> FAQ</a>
              <div class="side-title" style="margin-top:20px">Account</div>
              <a class="side-link" data-action="logout"><i class="fa-solid fa-right-from-bracket"></i> Log Out</a>
              <a class="side-link" id="deleteAccountLink" style="color:var(--maroon-500)!important"><i class="fa-solid fa-trash-can"></i> Delete My Data</a>
            </div>
            <div class="dash-main">
              <div class="dash-topbar">
                <div>
                  <h2>Hello, ${esc(app.fullName?.split(' ')[0] || 'Applicant')}</h2>
                  <div style="font-size:13px;color:var(--slate-500)">ID: ${displayId(app)} · Updated ${fmtDate(app.updatedAt)}</div>
                </div>
                ${statusBadge(app.status)}
              </div>

              ${userApps.length > 1 ? `
              <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px;padding:10px 14px;background:#fff;border:1px solid var(--slate-200);border-radius:8px;align-items:center">
                <span style="font-size:12px;font-weight:700;color:var(--slate-500);text-transform:uppercase;letter-spacing:.03em">Applications</span>
                ${userApps.map((a,i)=>{
                    const isActive = a.id === app.id;
                    return `<button class="chip ${isActive?'active':''}" data-switchapp="${a.id}" style="font-size:11px">${esc(a.jobTitle||'App '+(i+1))}</button>`;
                }).join("")}
              </div>` : ''}

              ${!isTerminal ? `<div class="progress-stages" style="margin-bottom:20px">${curStageIdx<0?`<span class="badge badge-slate" style="font-size:12px"><i class="fa-solid fa-circle"></i> ${esc(app.status||'No Status')}</span><span style="font-size:11px;color:var(--slate-500);margin-left:8px">Awaiting first status update</span>`:STATUS_STEPS.map((s,i)=>{
                  const cls=i<curStageIdx?'done':i===curStageIdx?'active':'';
                  const ico=i<curStageIdx?'fa-check-circle':i===curStageIdx?'fa-circle':'fa-circle-regular';
                  return `<div class="stage ${cls}"><span class="stage-icon"><i class="fa-regular ${ico}"></i></span>${s}</div>`;
              }).join("")}</div>` : ''}

              <div class="dash-section">
                <div class="dash-quick-grid">
                  <div class="dash-quick-card" data-action="chat-admin">
                    <div class="q-icon" style="background:var(--blue-50);color:var(--blue-700)"><i class="fa-solid fa-comment-dots"></i></div>
                    <div><div class="q-label">Chat with Admin</div><div class="q-sub">Send a message</div></div>
                  </div>
                  <div class="dash-quick-card" data-nav="jobs">
                    <div class="q-icon" style="background:var(--emerald-50);color:var(--emerald-600)"><i class="fa-solid fa-briefcase"></i></div>
                    <div><div class="q-label">Browse Jobs</div><div class="q-sub">View more openings</div></div>
                  </div>
                </div>
              </div>

              <div class="dash-section card pad">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
                  <h4 style="margin:0;color:var(--blue-900);font-size:14px"><i class="fa-solid fa-circle-check" style="color:var(--maroon-500)"></i> Application Progress</h4>
                  <span style="font-size:12px;color:var(--slate-500)">${filled}/${fields.length}</span>
                </div>
                <div style="height:8px;background:var(--slate-100);border-radius:99px;overflow:hidden">
                  <div style="height:100%;width:${pct}%;background:${pct === 100 ? 'var(--emerald-500)' : pct > 50 ? 'var(--maroon-500)' : 'var(--amber-500)'};border-radius:99px;transition:width .5s"></div>
                </div>
                ${pct<100?(()=>{
                  const missing=[];
                  ['fullName','dob','nationality','phone','email','address','city','education','jobId','passportNumber'].forEach(f=>{if(!app[f])missing.push(f==='jobId'?'Job Interested In':f.charAt(0).toUpperCase()+f.slice(1));});
                  if(!app.cvUrl)missing.push('CV / Resume');
                  if(!app.passportUrl)missing.push('Passport Upload');
                  if(!missing.length)return '';
                  return `<div style="margin-top:8px;font-size:12px;color:var(--slate-600);background:var(--amber-50);border-radius:6px;padding:10px 14px"><b style="color:var(--amber-700)">Complete your application:</b><br>${missing.map(m=>`<span style="display:inline-block;margin:2px 6px 2px 0">• ${esc(m)}</span>`).join('')}</div>`;
                })():`<div style="margin-top:8px;font-size:12px;color:var(--emerald-600);font-weight:600;display:flex;align-items:center;gap:6px"><i class="fa-solid fa-circle-check"></i> All fields completed</div>`}
              </div>

              <div class="dash-section card pad">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;flex-wrap:wrap;gap:8px">
                  <h4 style="margin:0;color:var(--blue-900);font-size:14px"><i class="fa-solid fa-coins" style="color:var(--maroon-500)"></i> Fee Status</h4>
                  <div style="display:flex;gap:14px;font-size:12px">
                    <span><b style="color:var(--emerald-600)">Paid:</b> KES ${totalPaid.toLocaleString()}</span>
                    <span><b style="color:var(--maroon-600)">Outstanding:</b> KES ${(totalOwed - totalPaid).toLocaleString()}</span>
                  </div>
                </div>
                ${appFees.length ? appFees.map((f,i)=>`
                  <div class="fee-row">
                    <span class="lbl">${esc(f.label)}</span>
                    <span class="amt">${esc(f.amount)}</span>
                    <span class="status ${f.paid?'badge-green':'badge-amber'}">${f.paid?(f.paidByClient?'Paid (You)':'Paid'):'Unpaid'}</span>
                    ${f.paidDate?`<span style="font-size:11px;color:var(--slate-400)">${fmtDate(f.paidDate)}</span>`:''}
                    ${!f.paid && f.amount ? `<button class="btn btn-maroon btn-sm pay-now-btn" data-pay-now data-pay-type="fee" data-pay-index="${i}" data-pay-appid="${app.id||app.appId||app.uid}" data-pay-amount="${esc(f.amount)}" data-pay-label="${esc(f.label)}" style="font-size:11px;padding:6px 14px;margin-left:auto"><i class="fa-solid fa-hand-holding-dollar"></i> Pay Now</button>` : ''}
                  </div>`).join("") : '<div style="padding:16px 0;text-align:center;color:var(--slate-400);font-size:13px">No fees recorded yet.</div>'}
              </div>

              <div class="dash-section">
                ${app.clientServices&&app.clientServices.length ? `
                <div class="card pad">
                  <h4 style="margin:0 0 16px;color:var(--blue-900);font-size:14px"><i class="fa-solid fa-handshake" style="color:var(--maroon-500)"></i> Assistance Services</h4>
                  <div class="dash-services-grid">
                    ${app.clientServices.map((s,i)=>{
                      const t=SERVICE_TYPES.find(st=>st.id===s.type);
                      const ico=t?t.icon:'fa-handshake';
                      const col=t?t.color:'var(--slate-500)';
                      const stCls=s.status==='completed'?'badge-green':s.status==='in-progress'?'badge-amber':s.status==='cancelled'?'badge-rose':'badge-slate';
                      const stLbl=s.status==='completed'?'Completed':s.status==='in-progress'?'In Progress':s.status==='cancelled'?'Cancelled':'Pending';
                      return `<div style="background:#fff;border:1px solid var(--slate-200);border-radius:10px;padding:16px">
                        <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px">
                          <span style="width:36px;height:36px;border-radius:10px;background:${col}20;color:${col};display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0"><i class="fa-solid ${ico}"></i></span>
                          <div><div style="font-weight:700;font-size:13.5px;color:var(--blue-900)">${esc(s.label)}</div>${s.description?`<div style="font-size:11.5px;color:var(--slate-500)">${esc(s.description)}</div>`:''}</div>
                        </div>
                        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:4px">
                          <span class="badge ${stCls}">${stLbl}</span>
                          ${s.amount?`<span style="font-weight:700;font-size:13px;color:var(--blue-800)">${esc(s.amount)}</span>`:''}
                        </div>
                        ${s.paid
                          ? `<div style="margin-top:8px;padding:6px 10px;background:var(--emerald-50);border-radius:6px;font-size:12px;color:var(--emerald-600);font-weight:600;display:flex;align-items:center;gap:6px"><i class="fa-solid fa-circle-check"></i> Paid${s.paidByClient?' (You)':''}${s.paidDate?` · ${fmtDate(s.paidDate)}`:''}</div>`
                          : s.amount
                            ? `<div style="margin-top:8px;display:flex;gap:8px;align-items:center"><div style="flex:1;padding:6px 10px;background:var(--amber-50);border-radius:6px;font-size:12px;color:var(--amber-600);font-weight:600;display:flex;align-items:center;gap:6px"><i class="fa-solid fa-clock"></i> Payment Pending</div><button class="btn btn-maroon btn-sm pay-now-btn" data-pay-now data-pay-type="service" data-pay-index="${i}" data-pay-appid="${app.id||app.appId||app.uid}" data-pay-amount="${esc(s.amount)}" data-pay-label="${esc(s.label)}" style="font-size:11px;padding:6px 14px"><i class="fa-solid fa-hand-holding-dollar"></i> Pay Now</button></div>`
                            : ''}
                      </div>`;
                    }).join("")}
                  </div>
                </div>` : `<div class="card pad" style="text-align:center;color:var(--slate-400);font-size:13px;padding:24px"><i class="fa-solid fa-handshake" style="font-size:24px;display:block;margin-bottom:8px;opacity:.4"></i>No assistance services added yet.</div>`}
              </div>

              <div class="dash-section dash-two-col">
                <div class="card pad">
                  <h4 style="margin:0 0 18px;color:var(--blue-900);font-size:14px"><i class="fa-solid fa-timeline" style="color:var(--maroon-500)"></i> Status Timeline</h4>
                  ${renderTimeline(app)}
                </div>
                <div>
                  <div class="card pad" style="margin-bottom:18px">
                    <h4 style="margin:0 0 14px;color:var(--blue-900);font-size:14px"><i class="fa-solid fa-briefcase" style="color:var(--maroon-500)"></i> Job Details</h4>
                    <div style="font-size:13.5px;color:var(--slate-600);line-height:1.9">
                      <div><b>Position:</b> ${esc(app.jobTitle)}</div>
                      <div><b>Country:</b> ${esc(app.country)}</div>
                      <div><b>Applied:</b> ${fmtDate(app.createdAt)}</div>
                    </div>
                  </div>
                  <div class="card pad" style="margin-bottom:18px">
                    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
                      <h4 style="margin:0;color:var(--blue-900);font-size:14px"><i class="fa-solid fa-user" style="color:var(--maroon-500)"></i> Personal Details</h4>
                      <button class="btn btn-outline btn-sm" data-action="edit-application" style="font-size:11.5px;padding:6px 14px"><i class="fa-solid fa-pen"></i> Edit</button>
                    </div>
                    <div style="font-size:13.5px;color:var(--slate-600);line-height:1.9">
                      <div><b>Full Name:</b> ${esc(app.fullName)}</div>
                      ${app.dob ? `<div><b>Date of Birth:</b> ${esc(app.dob)}</div>` : ''}
                      ${app.nationality ? `<div><b>Nationality:</b> ${esc(app.nationality)}</div>` : ''}
                      <div><b>Phone:</b> ${esc(app.phone)}</div>
                      <div><b>Email:</b> ${esc(app.email)}</div>
                      ${app.address ? `<div><b>Address:</b> ${esc(app.address)}</div>` : ''}
                      ${app.education ? `<div><b>Education:</b> ${esc(app.education)}</div>` : ''}
                      ${app.passportNumber ? `<div><b>Passport:</b> ${esc(app.passportNumber)}</div>` : ''}
                    </div>
                  </div>
                  <div class="card pad">
                    <h4 style="margin:0 0 14px;color:var(--blue-900);font-size:14px"><i class="fa-solid fa-file" style="color:var(--maroon-500)"></i> Documents</h4>
                    ${[
                        {key:'cv',label:'CV / Resume',icon:'fa-file-lines',url:app.cvUrl},
                        {key:'passport',label:'Passport Copy',icon:'fa-passport',url:app.passportUrl},
                        {key:'certificates',label:'Certificates',icon:'fa-certificate',url:app.certificatesUrl},
                        {key:'reference',label:'Reference Letter',icon:'fa-envelope',url:app.referenceUrl},
                        {key:'medical',label:'Medical Report',icon:'fa-heart-pulse',url:app.medicalUrl}
                    ].map(d=>{
                        const hasUrl = !!d.url;
                        const st = !hasUrl ? 'not_uploaded' : (app.documentStatus?.[d.key] || 'pending_review');
                        const isImg = d.url && /\.(jpg|jpeg|png|gif|webp|bmp)(\?.*)?$/i.test(d.url);
                        const isPdf = d.url && /\.pdf(\?.*)?$/i.test(d.url);
                        const previewHtml = hasUrl
                            ? (isImg
                                ? `<div class="doc-preview-thumb" data-preview="${d.url}" data-label="${d.label}"><img src="${d.url}" alt="${d.label}" loading="lazy"><span class="doc-name">${d.label}</span></div>`
                                : isPdf
                                    ? `<div class="doc-preview-thumb" data-preview="${d.url}" data-label="${d.label}"><span class="doc-icon"><i class="fa-solid fa-file-pdf"></i></span><span class="doc-name">${d.label}</span></div>`
                                    : `<div class="doc-preview-thumb" data-preview="${d.url}" data-label="${d.label}"><span class="doc-icon"><i class="fa-solid fa-file"></i></span><span class="doc-name">${d.label}</span></div>`)
                            : `<div style="font-size:11.5px;color:var(--slate-400);font-style:italic">Not uploaded</div>`;
                        const acts = [];
                        if(st==='not_uploaded') acts.push(`<button class="btn btn-outline btn-sm" data-action="upload-${d.key}">Upload</button>`);
                        else if(st==='changes_requested'||st==='upload_again'||st==='rejected') acts.push(`<button class="btn btn-outline btn-sm" data-action="upload-${d.key}">Upload New</button>`);
                        else acts.push(`<button class="btn btn-outline btn-sm" data-action="upload-${d.key}">Replace</button>`);
                        return `<div class="doc-row"><div class="di"><i class="fa-solid ${d.icon}"></i> ${d.label}</div>${previewHtml}<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">${docStatusBadge(st)}${acts.join('')}</div></div>`;
                    }).join("")}
                  </div>
                </div>
              </div>

              <div style="display:flex;gap:12px;flex-wrap:wrap;margin-top:6px;padding:12px 0">
                <a class="btn btn-primary" data-nav="messages"><i class="fa-solid fa-comment-dots"></i> Open Messages</a>
                <a class="btn btn-outline" data-nav="jobs"><i class="fa-solid fa-briefcase"></i> Browse More Jobs</a>
              </div>
            </div>
          </div>`;
        }

        async function deleteMyAccount() {
            if (!confirm('This will permanently delete ALL your personal data, applications, messages, and account. This CANNOT be undone. Continue?')) return;
            if (!confirm('⚠️ FINAL WARNING: Type "DELETE" to confirm permanent deletion of all your data.')) return;
            try {
                const uid = currentUser?.uid;
                if (uid) {
                    const appsSnap = await getDocs(query(collection(db,"applications"), where("uid","==",uid)));
                    appsSnap.forEach(d => d.ref.delete().catch(()=>{}));
                    const chatsSnap = await getDocs(query(collection(db,"chats"), where("participants","array-contains",uid)));
                    for (const chatDoc of chatsSnap.docs) {
                        const msgsSnap = await getDocs(collection(db,"chats",chatDoc.id,"messages"));
                        msgsSnap.forEach(m => m.ref.delete().catch(()=>{}));
                        chatDoc.ref.delete().catch(()=>{});
                    }
                    await deleteDoc(doc(db,"applications",uid)).catch(()=>{});
                }
                toast("All your data has been deleted. You will now be signed out.","ok");
                await signOut(auth); navigate("home");
            } catch(e) { toast("Error deleting account: "+e.message,"err"); }
        }
        function wireApplicantDashboard() {
            document.getElementById('deleteAccountLink')?.addEventListener('click', deleteMyAccount);
            document.querySelectorAll('[data-action^="upload-"]').forEach(b => b.addEventListener('click', function(){
                const key = this.getAttribute('data-action').replace('upload-','');
                const field = key === 'cv' ? 'cvUrl' : key === 'passport' ? 'passportUrl' : key + 'Url';
                const labelMap = {cv:'CV',passport:'Passport',certificates:'Certificates',reference:'Reference Letter',medical:'Medical Report',contract:'Contract'};
                uploadDoc(field, labelMap[key]||key, key);
            }));
            document.querySelectorAll('[data-action="edit-application"]').forEach(b => b.addEventListener('click', function(){
                const app = currentUserData;
                if (app && app.type === 'applicant') showEditApplicationModal(app);
                else toast('Application data not available.', 'err');
            }));
            document.querySelectorAll('.doc-preview-thumb').forEach(el => el.addEventListener('click', function(){
                const url = this.getAttribute('data-preview');
                const label = this.getAttribute('data-label');
                if (url) showDocPreviewModal(url, label);
            }));
            document.querySelectorAll('[data-action="chat-admin"]').forEach(b => b.addEventListener('click', startChatWithAdmin));
            document.querySelectorAll('[data-switchapp]').forEach(b => b.addEventListener('click', function(){
                navigate("applicant-dashboard", { appId: this.getAttribute('data-switchapp') });
            }));
        }
        function showModal({ title, bodyHtml, footerHtml = '', wide = false, onOpen }) {
            const root = document.getElementById('modal-root');
            root.innerHTML = `
            <div class="modal-overlay" id="modalOverlay">
              <div class="modal" style="${wide ? 'max-width:900px' : ''}">
                <div class="modal-head">
                  <h3>${title}</h3>
                  <button class="modal-close" id="modalCloseBtn"><i class="fa-solid fa-xmark"></i></button>
                </div>
                <div class="modal-body">${bodyHtml}</div>
                ${footerHtml ? `<div class="modal-foot">${footerHtml}</div>` : ''}
              </div>
            </div>`;
            const close = () => { root.innerHTML = ''; };
            document.getElementById('modalCloseBtn')?.addEventListener('click', close);
            document.getElementById('modalOverlay')?.addEventListener('click', (e) => { if (e.target === e.currentTarget) close(); });
            root.querySelectorAll('[data-modal-close]').forEach(el => el.addEventListener('click', close));
            if (onOpen) setTimeout(onOpen, 50);
        }

        function showDocPreviewModal(url, label) {
            const isImg = /\.(jpg|jpeg|png|gif|webp|bmp)(\?.*)?$/i.test(url);
            const isPdf = /\.pdf(\?.*)?$/i.test(url);
            const bodyHtml = isImg
                ? `<div class="preview-modal-body"><img src="${url}" alt="${esc(label)}"></div>`
                : isPdf
                    ? `<div class="preview-modal-body"><iframe src="${url}" title="${esc(label)}"></iframe></div>`
                    : `<div class="preview-modal-body"><div class="preview-fallback"><i class="fa-solid fa-file"></i><p style="font-size:14px;font-weight:600;margin-bottom:6px">${esc(label)}</p><p style="font-size:12px;margin:0">Preview not available inline.</p><a href="${url}" target="_blank" class="btn btn-primary mt-16" style="display:inline-flex"><i class="fa-solid fa-download"></i> Download File</a></div></div>`;
            showModal({
                title: esc(label),
                bodyHtml,
                wide: true
            });
        }

        function showEditApplicationModal(app) {
            const nationalityOptions = NATIONALITIES.map(n =>
                `<option value="${n.code}" ${app.nationalityCode === n.code ? 'selected' : ''}>${n.flag} ${n.name}</option>`
            ).join('');
            const phoneParts = (app.phone || '').split(' ');
            const phoneCode = phoneParts.length > 1 ? phoneParts[0] : '+1';
            const phoneNumber = phoneParts.length > 1 ? phoneParts.slice(1).join(' ') : (app.phone || '');
            const educationOptions = ['High School','Associate\'s Degree','Bachelor\'s Degree','Master\'s Degree','PhD','Vocational/Technical','Other'].map(o =>
                `<option value="${o}" ${app.education === o ? 'selected' : ''}>${o}</option>`
            ).join('');
            const jobOptions = allJobs.map(j =>
                `<option value="${j.id}" ${app.jobId === j.id ? 'selected' : ''}>${esc(j.title)} — ${esc(j.country)}</option>`
            ).join('');

            const bodyHtml = `
            <form id="editAppForm" class="edit-form">
              <div class="field-row">
                <div class="field">
                  <label>Full Name <span class="req">*</span></label>
                  <input type="text" name="fullName" value="${esc(app.fullName || '')}" required>
                </div>
                <div class="field">
                  <label>Date of Birth <span class="req">*</span></label>
                  <input type="date" name="dob" value="${app.dob || ''}" required>
                </div>
              </div>
              <div class="field-row-3">
                <div class="field">
                  <label>Nationality <span class="req">*</span></label>
                  <select name="nationality" required>${nationalityOptions}</select>
                </div>
                <div class="field" style="display:flex;flex-direction:column">
                  <label>Phone <span class="req">*</span></label>
                  <div class="phone-wrapper">
                    <input type="text" name="phoneCode" value="${esc(phoneCode)}" placeholder="Code" style="max-width:100px;flex-shrink:0">
                    <input type="tel" name="phoneNumber" value="${esc(phoneNumber)}" placeholder="Phone number" required>
                  </div>
                </div>
                <div class="field">
                  <label>Email <span class="req">*</span></label>
                  <input type="email" name="email" value="${esc(app.email || '')}" required>
                </div>
              </div>
              <div class="field">
                <label>Address</label>
                <input type="text" name="address" value="${esc(app.address || '')}">
              </div>
              <div class="field-row">
                <div class="field">
                  <label>Residence Country</label>
                  <input type="text" name="residence" value="${esc(app.residence || '')}">
                </div>
                <div class="field">
                  <label>City</label>
                  <input type="text" name="city" value="${esc(app.city || '')}">
                </div>
              </div>
              <div class="field-row">
                <div class="field">
                  <label>Education <span class="req">*</span></label>
                  <select name="education" required>${educationOptions}</select>
                </div>
                <div class="field">
                  <label>Passport Number</label>
                  <input type="text" name="passportNumber" value="${esc(app.passportNumber || '')}">
                </div>
              </div>
              <div class="field">
                <label>Job Interested In <span class="req">*</span></label>
                <select name="jobId" required>
                  <option value="">Select a job...</option>
                  ${jobOptions}
                </select>
              </div>
              <div class="field">
                <label>Work Experience</label>
                <textarea name="workExperience">${esc(app.workExperience || '')}</textarea>
              </div>
              <div class="field">
                <label>Cover Letter / Message</label>
                <textarea name="cover">${esc(app.coverLetter || app.cover || '')}</textarea>
              </div>
              <input type="hidden" name="appId" value="${app.id}">
            </form>`;

            showModal({
                title: `<i class="fa-solid fa-pen" style="color:var(--maroon-500)"></i> Edit Application`,
                bodyHtml,
                footerHtml: `<button class="btn btn-outline" data-modal-close>Cancel</button><button class="btn btn-primary" id="saveEditBtn"><i class="fa-solid fa-floppy-disk"></i> Save Changes</button>`,
                onOpen: () => {
                    document.getElementById('saveEditBtn')?.addEventListener('click', async () => {
                        const btn = document.getElementById('saveEditBtn');
                        if (btn?.disabled) return;
                        const form = document.getElementById('editAppForm');
                        if (!form) return;
                        const fd = new FormData(form);
                        const fullName = fd.get('fullName')?.toString().trim();
                        const dob = fd.get('dob')?.toString().trim();
                        const nationality = fd.get('nationality')?.toString().trim();
                        const phoneCode = fd.get('phoneCode')?.toString().trim();
                        const phoneNumber = fd.get('phoneNumber')?.toString().trim();
                        const email = fd.get('email')?.toString().trim();
                        const address = fd.get('address')?.toString().trim();
                        const residence = fd.get('residence')?.toString().trim();
                        const city = fd.get('city')?.toString().trim();
                        const education = fd.get('education')?.toString().trim();
                        const passportNumber = fd.get('passportNumber')?.toString().trim();
                        const jobId = fd.get('jobId')?.toString().trim();
                        const workExperience = fd.get('workExperience')?.toString().trim();
                        const cover = fd.get('cover')?.toString().trim();
                        const appId = fd.get('appId')?.toString().trim();

                        if (!fullName || !dob || !nationality || !phoneNumber || !email || !education || !jobId) {
                            toast('Please fill in all required fields.', 'err'); return;
                        }
                        if (!/^\S+@\S+\.\S+$/.test(email)) { toast('Invalid email address.', 'err'); return; }

                        const natObj = NATIONALITIES.find(n => n.code === nationality);
                        const fullPhone = `${phoneCode} ${phoneNumber}`;
                        const job = allJobs.find(j => j.id === jobId);

                        const patch = {
                            fullName, dob, nationality: natObj ? natObj.name : nationality,
                            nationalityCode: nationality, phone: fullPhone, phoneCode, phoneNumber,
                            email, address, residence, city, education, passportNumber,
                            jobId, jobTitle: job ? job.title : '', country: job ? job.country : '',
                            workExperience, coverLetter: cover,
                        };

                        if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving...'; }
                        try {
                            await updateApp(appId, patch);
                            if (currentUserData && currentUserData.id === appId) {
                                Object.assign(currentUserData, patch);
                            }
                            const appIdx = allApps.findIndex(a => a.id === appId);
                            if (appIdx >= 0) Object.assign(allApps[appIdx], patch);
                            closeModal();
                            toast('Application updated successfully!', 'ok');
                            renderCurrentView();
                        } catch (e) {
                            toast(e.message || 'Failed to update application.', 'err');
                        } finally {
                            if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Save Changes'; }
                        }
                    });
                }
            });
        }

        let _uploadingToastEl = null;
        function showUploadingToast(msg) {
            const wrap = document.getElementById('toast-wrap');
            if (!wrap) return;
            hideUploadingToast();
            const el = document.createElement('div');
            el.className = 'toast toast-uploading';
            el.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i><span>${esc(msg || 'Uploading...')}</span>`;
            wrap.appendChild(el);
            _uploadingToastEl = el;
        }
        function hideUploadingToast() {
            if (_uploadingToastEl) {
                const el = _uploadingToastEl;
                _uploadingToastEl = null;
                el.style.opacity = '0';
                el.style.transition = '.3s';
                setTimeout(() => el.remove(), 300);
            }
        }

        // Upload → wait for Uploadcare to finish → show preview + confirm modal.
        // Applicant can Preview the file, Replace it, or Save it to the application.
        function uploadDoc(field, label, docKey) {
            const openPicker = () => {
                const dialog = uploadcare.openDialog(null, {
                    publicKey: UPLOADCARE_PUBLIC_KEY, multiple: false, imgOnly: false,
                    accept: field === 'cvUrl' ? 'application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document' : 'image/jpeg,image/png'
                });
                dialog.done(async (file) => {
                    showUploadingToast(`Uploading ${label} — please wait...`);
                    try {
                        const info = await file.promise(); validateFileSize(10)(info)
                        hideUploadingToast();
                        const url = info.cdnUrl;
                        const name = info.name || label;
                        const app = currentUserData;
                        if (!app || app.type !== 'applicant') return;
                        const uid = app.uid || currentUser?.uid;
                        if (!uid) return;
                        const curSt = app.documentStatus?.[docKey] || 'not_uploaded';
                        const newSt = (curSt === 'changes_requested' || curSt === 'upload_again' || curSt === 'rejected') ? 'reuploaded' : 'pending_review';
                        const saveDoc = async () => {
                            await setDoc(doc(db, "applications", uid), { [field]: url, [`documentStatus.${docKey}`]: newSt, updatedAt: serverTimestamp() }, { merge: true });
                            app[field] = url;
                            if(!app.documentStatus) app.documentStatus = {};
                            app.documentStatus[docKey] = newSt;
                            notifyAdmin(`${label} re-uploaded by ${app.fullName||'Applicant'} — awaiting review.`);
                            toast(`${label} uploaded successfully!`, 'ok');
                            renderCurrentView();
                        };
                        const isImg = /\.(jpg|jpeg|png|gif|webp|bmp)(\?.*)?$/i.test(url);
                        const isPdf = /\.pdf(\?.*)?$/i.test(url);
                        const previewHtml = isImg
                            ? `<div class="preview-modal-body"><img src="${url}" alt="${esc(label)}"></div>`
                            : isPdf
                                ? `<div class="preview-modal-body"><iframe src="${url}" title="${esc(label)}"></iframe></div>`
                                : `<div class="preview-modal-body"><div class="preview-fallback"><i class="fa-solid fa-file"></i><p style="font-size:14px;font-weight:600;margin-bottom:6px">${esc(name)}</p><p style="font-size:12px;margin:0">Preview not available inline.</p><a href="${url}" target="_blank" class="btn btn-primary mt-16" style="display:inline-flex"><i class="fa-solid fa-download"></i> Download File</a></div></div>`;
                        showModal({
                            title: `<i class="fa-solid fa-file-circle-check" style="color:var(--emerald-600)"></i> ${esc(label)} — Ready to Review`,
                            bodyHtml: `
                                <div style="background:var(--emerald-50);border:1px solid #bfe6cc;border-radius:10px;padding:12px 14px;margin-bottom:14px;display:flex;align-items:center;gap:10px">
                                    <i class="fa-solid fa-circle-check" style="color:var(--emerald-600);font-size:18px"></i>
                                    <div style="font-size:13px;color:#065F46"><b>${esc(name)}</b> uploaded successfully. Preview it below — you can replace it or save it to your application.</div>
                                </div>
                                ${previewHtml}`,
                            footerHtml: `<button class="btn btn-outline" data-modal-close>Cancel</button><button class="btn btn-outline" id="reuploadReplaceBtn"><i class="fa-solid fa-rotate"></i> Replace</button><button class="btn btn-success" id="reuploadSaveBtn"><i class="fa-solid fa-check"></i> Save Document</button>`,
                            wide: true,
                            onOpen: () => {
                                document.getElementById('reuploadReplaceBtn')?.addEventListener('click', () => { closeModal(); setTimeout(openPicker, 60); });
                                document.getElementById('reuploadSaveBtn')?.addEventListener('click', async () => {
                                    const btn = document.getElementById('reuploadSaveBtn');
                                    if (btn?.disabled) return;
                                    if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving...'; }
                                    try {
                                        await saveDoc();
                                        closeModal();
                                    } catch (e) {
                                        console.error("Save error:", e);
                                        toast(e.message || "Failed to save document.", "err");
                                        if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fa-solid fa-check"></i> Save Document'; }
                                    }
                                });
                            }
                        });
                    } catch (e) {
                        hideUploadingToast();
                        console.error("Upload error:", e);
                        toast(e.message || "Upload failed.", "err");
                    }
                });
                dialog.fail(() => { hideUploadingToast(); toast("Upload cancelled.", "err"); });
            };
            openPicker();
        }

        let adminFilters = { status: "All", country: "All", search: "", showBlocked: false };

        function viewAdminDashboard() {
            if (!currentUser || !currentUserData || currentUserData.type !== 'admin') {
                return `<div class="section"><div class="wrap"><div class="empty-state"><i class="fa-solid fa-lock"></i><p>Admin access required.</p><a class="btn btn-primary" data-nav="login">Log In</a></div></div></div>`;
            }
            const apps = allApps.filter(a => !a.archived && (adminFilters.showBlocked || !a.blocked));
            const stats = {
                total: apps.length,
                received: apps.filter(a => a.status === "Application Received").length,
                inProgress: apps.filter(a => !TERMINAL_ALT.includes(a.status) && a.status !== "Placed — Active Employment" && a.status !== "Application Received").length,
                placed: apps.filter(a => a.status === "Placed — Active Employment").length,
                rejected: apps.filter(a => a.status === "Rejected").length,
            };
            let filtered = apps.filter(a =>
                (adminFilters.status === "All" || a.status === adminFilters.status) &&
                (adminFilters.country === "All" || a.country === adminFilters.country) &&
                (adminFilters.search === "" || (a.fullName + a.email + a.id + a.uid + a.jobTitle + (a.nationality||'') + (a.passportNumber||'')).toLowerCase().includes(adminFilters.search.toLowerCase()))
            ).sort((a, b) => { const da = a.updatedAt ? new Date(a.updatedAt) : new Date(0); const db = b.updatedAt ? new Date(b.updatedAt) : new Date(0); return db - da; });
            const pg = pgSlice('adash', filtered);

            const unread = getUnreadCount();
            const recent = filtered.slice(0, 3);
            return `
          <div class="dash-shell">
            <div class="dash-side">
              <div class="side-title">Admin Console</div>
              <a class="side-link active"><i class="fa-solid fa-gauge"></i> Applications</a>
              <a class="side-link" data-nav="admin-jobs"><i class="fa-solid fa-briefcase"></i> Manage Jobs</a>
              <a class="side-link" data-nav="admin-fees"><i class="fa-solid fa-coins"></i> Fee Structure</a>
              <a class="side-link" data-nav="admin-finance"><i class="fa-solid fa-chart-line"></i> Finance</a>
              <a class="side-link" data-nav="messages"><i class="fa-solid fa-comment-dots"></i> Messages${unread ? ` <span class="msg-count">${unread}</span>` : ''}</a>
              <div class="side-title" style="margin-top:20px">Account</div>
              <a class="side-link" data-action="logout"><i class="fa-solid fa-right-from-bracket"></i> Log Out</a>
            </div>
            <div class="dash-main">
              <div class="dash-topbar">
                <h2>Applications Dashboard</h2>
                <div style="display:flex;gap:10px;align-items:center">
                  ${usingFallbackJobs ? '<span class="badge badge-amber"><i class="fa-solid fa-triangle-exclamation"></i> Fallback Mode</span>' : '<span class="badge badge-green"><i class="fa-solid fa-database"></i> Live</span>'}
                  <div class="search-input"><i class="fa-solid fa-magnifying-glass"></i><input type="text" id="adminSearch" placeholder="Search name, email, ID, job..." value="${esc(adminFilters.search)}"></div>
                </div>
              </div>
              <div class="stat-grid" style="margin-bottom:20px">
                <div class="stat-card"><div class="n">${stats.total}</div><div class="l"><i class="fa-solid fa-users"></i> Total</div></div>
                <div class="stat-card" style="border-left:3px solid var(--blue-500)"><div class="n">${stats.received}</div><div class="l"><i class="fa-solid fa-inbox"></i> New</div></div>
                <div class="stat-card" style="border-left:3px solid var(--amber-500)"><div class="n">${stats.inProgress}</div><div class="l"><i class="fa-solid fa-spinner"></i> In Progress</div></div>
                <div class="stat-card" style="border-left:3px solid var(--emerald-500)"><div class="n">${stats.placed}</div><div class="l"><i class="fa-solid fa-check-circle"></i> Placed</div></div>
                <div class="stat-card" style="border-left:3px solid var(--rose-500)"><div class="n">${stats.rejected}</div><div class="l"><i class="fa-solid fa-times-circle"></i> Rejected</div></div>
              </div>
              <div style="display:flex;gap:8px;margin-bottom:18px;flex-wrap:wrap">
                <button class="btn btn-outline btn-sm" data-action="seed-jobs" title="Add sample jobs to database"><i class="fa-solid fa-seedling"></i> Seed Jobs</button>
                <button class="btn btn-outline btn-sm" data-action="clear-jobs" title="Remove all jobs from database"><i class="fa-solid fa-trash-can"></i> Clear Jobs</button>
                <button class="btn btn-outline btn-sm" data-action="refresh"><i class="fa-solid fa-rotate"></i> Refresh</button>
              </div>
              ${recent.length ? `<div class="card pad" style="margin-bottom:18px;padding:14px 18px">
                <h4 style="margin:0 0 12px;font-size:13px;color:var(--slate-500);text-transform:uppercase;letter-spacing:.05em">Recent Applications</h4>
                ${recent.map(a => `<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid var(--slate-100)"><div><b style="color:var(--blue-900)">${esc(a.fullName)}</b><span style="font-size:12px;color:var(--slate-500);margin-left:10px">${esc(a.jobTitle)}</span></div><div style="display:flex;gap:10px;align-items:center"><span style="font-size:11px;color:var(--slate-400)">${fmtDate(a.updatedAt)}</span>${statusBadge(a.status)}</div></div>`).join("")}
              </div>` : ''}
              <div style="display:flex;gap:6px;align-items:center;margin-bottom:8px;flex-wrap:wrap">
                <label style="font-size:12px;display:flex;align-items:center;gap:6px;cursor:pointer;font-weight:600;color:var(--slate-600)"><input type="checkbox" id="idxShowBlockedCb" ${adminFilters.showBlocked?'checked':''}> Show blocked accounts</label>
              </div>
              <div class="filter-bar">${["All", ...COUNTRIES].map(c => `<button class="chip ${adminFilters.country === c ? 'active' : ''}" data-afcountry="${esc(c)}">${c}</button>`).join("")}</div>
              <div class="filter-bar">${["All", ...ALL_STATUSES].map(s => `<button class="chip ${adminFilters.status === s ? 'active' : ''}" data-afstatus="${esc(s)}">${s}</button>`).join("")}</div>
              <div class="card">
                <div class="table-wrap">
                <table>
                  <thead><tr><th class="rnum">#</th><th>Applicant</th><th>Job / Country</th><th>Status</th><th>Completeness</th><th>Updated</th><th></th><th class="rnum">#</th></tr></thead>
                  <tbody>
                    ${filtered.length ? pg.items.map((a,ai) => {
                      const cmp=calcCompleteness(a);
                      const cls=cmp>=80?'var(--emerald-500)':cmp>=40?'var(--amber-500)':'var(--maroon-500)';
                      return `<tr>
                        <td class="rnum">${pg.start+ai+1}</td>
                        <td><b style="color:var(--blue-900)">${esc(a.fullName)}</b><br><span style="font-size:12px;color:var(--slate-500)">${displayId(a)}</span>${a.email?`<br><span style="font-size:11px;color:var(--slate-400)">${esc(a.email)}</span>`:''}${a.blocked?` <span class="badge badge-rose" style="font-size:9px">BLOCKED</span>`:''}</td>
                        <td>${esc(a.jobTitle)||'—'}<br>${a.country?`<span style="font-size:12px;color:var(--slate-500)"><img src="${flagUrl((COUNTRY_META[a.country]||{}).flag||'')}" alt="" style="width:14px;height:10px;border-radius:2px;display:inline-block;vertical-align:middle;margin-right:3px">${esc(a.country)}</span>`:'<span style="font-size:12px;color:var(--slate-400)">—</span>'}</td>
                        <td>${statusBadge(a.status)}</td>
                        <td style="white-space:nowrap;font-size:11px">
                          <div style="height:5px;background:var(--slate-100);border-radius:99px;overflow:hidden;min-width:50px">
                            <div style="height:100%;width:${cmp}%;background:${cls};border-radius:99px"></div>
                          </div>
                          ${cmp}%
                        </td>
                        <td style="font-size:12px;color:var(--slate-500);white-space:nowrap">${fmtDate(a.updatedAt)}</td>
                        <td><button class="btn btn-outline btn-sm" data-openapp="${displayId(a)}">Review <i class="fa-solid fa-chevron-right"></i></button></td>
                        <td class="rnum">${pg.start+ai+1}</td>
                      </tr>`;
                    }).join("") : `<tr><td colspan="8"><div class="empty-state"><i class="fa-solid fa-inbox"></i><p>No applications match these filters.</p></div></td></tr>`}
                  </tbody>
                </table>
                  </div>
                  ${pgBar('adash', pg)}
                </div>
            </div>
          </div>`;
        }

        function wireAdminDashboard() {
            document.getElementById('idxShowBlockedCb')?.addEventListener('change',function(){adminFilters.showBlocked=this.checked;saveAdminFilters();renderCurrentView();});
            const s = document.getElementById('adminSearch');
            if (s) s.addEventListener('input', () => { adminFilters.search = s.value; saveAdminFilters(); renderList(); });
            document.querySelectorAll('[data-afcountry]').forEach(b => b.addEventListener('click', () => { adminFilters.country = b.getAttribute('data-afcountry'); saveAdminFilters(); renderCurrentView(); }));
            document.querySelectorAll('[data-afstatus]').forEach(b => b.addEventListener('click', () => { adminFilters.status = b.getAttribute('data-afstatus'); saveAdminFilters(); renderCurrentView(); }));
            document.querySelectorAll('[data-openapp]').forEach(b => b.addEventListener('click', () => openAdminAppModal(b.getAttribute('data-openapp'))));
            document.querySelectorAll('[data-action="seed-jobs"]').forEach(b => b.addEventListener('click', async () => {
                await seedAllJobs(); await loadJobs(); renderCurrentView();
            }));
            document.querySelectorAll('[data-action="clear-jobs"]').forEach(b => b.addEventListener('click', async () => {
                if (!confirm("Clear ALL jobs from the database?")) return;
                await clearAllJobs(); await loadJobs(); renderCurrentView();
            }));
            document.querySelectorAll('[data-action="refresh"]').forEach(b => b.addEventListener('click', async () => {
                await Promise.all([loadJobs(), loadApps(), loadFees()]);
                renderCurrentView();
                toast("Data refreshed.", "ok");
            }));
            function renderList() {
                renderCurrentView();
                setTimeout(() => { const el = document.getElementById('adminSearch'); if (el) { el.focus(); el.setSelectionRange(el.value.length, el.value.length); } }, 0);
            }
        }

        async function openAdminAppModal(appId) {
            let app = allApps.find(a => a.id === appId || a.uid === appId || a.appId === appId);
            if (!app) { try { const docSnap = await getDoc(doc(db, "applications", appId)); if (docSnap.exists()) app = { id: docSnap.id, ...docSnap.data() }; } catch (e) {} }
            if (!app) { toast("Application not found.", "err"); return; }
            const root = document.getElementById('modal-root');
            const natFlag = app.nationalityCode ? NATIONALITIES.find(n => n.code === app.nationalityCode) : null;
            const appFees = app.fees || [];
            const totalOwed = appFees.reduce((s,f)=>{const p=parseAmountKES(f.amount);return s+p.kes},0);
            const totalPaid = appFees.filter(f=>f.paid).reduce((s,f)=>{const p=parseAmountKES(f.amount);return s+p.kes},0);
            root.innerHTML = `
          <div class="modal-overlay" id="modalOverlay">
            <div class="modal">
              <div class="modal-head">
                <h3><i class="fa-solid fa-folder-open" style="color:var(--blue-700)"></i> ${esc(app.fullName)} — ${displayId(app)}</h3>
                <button class="modal-close" id="modalCloseBtn"><i class="fa-solid fa-xmark"></i></button>
              </div>
              <div class="modal-body">
                <div style="margin-bottom:16px">
                  <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:4px"><span style="font-weight:700;color:var(--slate-600)">Application Completeness</span><span style="color:var(--slate-500)">${calcCompleteness(app)}%</span></div>
                  <div style="height:6px;background:var(--slate-100);border-radius:99px;overflow:hidden"><div style="height:100%;width:${calcCompleteness(app)}%;background:${calcCompleteness(app)>=80?'var(--emerald-500)':calcCompleteness(app)>=40?'var(--amber-500)':'var(--maroon-500)'};border-radius:99px;transition:width .5s"></div></div>
                </div>
                <div class="grid" style="grid-template-columns:1fr 1fr 1fr;margin-bottom:20px">
                  <div>
                    <div style="font-size:12px;color:var(--slate-500)">Full Name</div>
                    <div style="font-size:14px;font-weight:600;margin-bottom:10px">${esc(app.fullName)}</div>
                    ${app.dob ? `<div style="font-size:12px;color:var(--slate-500)">Date of Birth</div>
                    <div style="font-size:14px;font-weight:600;margin-bottom:10px">${esc(app.dob)}</div>` : ''}
                    <div style="font-size:12px;color:var(--slate-500)">Nationality</div>
                    <div style="font-size:14px;font-weight:600;margin-bottom:10px">${natFlag ? `<img src="${flagUrl(natFlag.flag)}" style="width:20px;height:15px;border-radius:2px;display:inline-block;vertical-align:middle;margin-right:6px">` : ''}${esc(app.nationality || '—')}</div>
                    <div style="font-size:12px;color:var(--slate-500)">Passport Number</div>
                    <div style="font-size:14px;font-weight:600">${esc(app.passportNumber || '—')}</div>
                  </div>
                  <div>
                    <div style="font-size:12px;color:var(--slate-500)">Email</div>
                    <div style="font-size:14px;font-weight:600;margin-bottom:10px">${esc(app.email)}</div>
                    <div style="font-size:12px;color:var(--slate-500)">Phone</div>
                    <div style="font-size:14px;font-weight:600;margin-bottom:10px">${esc(app.phone || '—')}</div>
                    <div style="font-size:12px;color:var(--slate-500)">Address</div>
                    <div style="font-size:14px;font-weight:600;margin-bottom:10px">${esc(app.address || '—')}</div>
                    <div style="font-size:12px;color:var(--slate-500)">City / Residence</div>
                    <div style="font-size:14px;font-weight:600">${esc(app.city || '—')} / ${esc(app.residence || '—')}</div>
                  </div>
                  <div>
                    <div style="font-size:12px;color:var(--slate-500)">Position</div>
                    <div style="font-size:14px;font-weight:600;margin-bottom:10px">${esc(app.jobTitle)}</div>
                    <div style="font-size:12px;color:var(--slate-500)">Destination</div>
                    <div style="font-size:14px;font-weight:600;margin-bottom:10px">${esc(app.country)}</div>
                    <div style="font-size:12px;color:var(--slate-500)">Education</div>
                    <div style="font-size:14px;font-weight:600;margin-bottom:10px">${esc(app.education || '—')}</div>
                    <div style="font-size:12px;color:var(--slate-500)">Applied</div>
                    <div style="font-size:14px;font-weight:600">${fmtDate(app.createdAt)}</div>
                  </div>
                </div>
                ${app.workExperience ? `<div style="margin-bottom:14px"><div style="font-size:12px;color:var(--slate-500);margin-bottom:6px">Work Experience</div><div style="font-size:13.5px;background:var(--slate-100);padding:12px 14px;border-radius:8px;color:var(--slate-700);white-space:pre-wrap">${esc(app.workExperience)}</div></div>` : ""}
                ${app.coverLetter ? `<div style="margin-bottom:14px"><div style="font-size:12px;color:var(--slate-500);margin-bottom:6px">Cover Letter</div><div style="font-size:13.5px;background:var(--slate-100);padding:12px 14px;border-radius:8px;color:var(--slate-700)">${esc(app.coverLetter)}</div></div>` : ""}
                <div style="margin-bottom:14px">
                  <div style="font-size:12px;color:var(--slate-500);margin-bottom:8px;font-weight:700">Documents</div>
                  ${[
                    {key:'cv',label:'CV / Resume',icon:'fa-file-lines',url:app.cvUrl},
                    {key:'passport',label:'Passport Copy',icon:'fa-passport',url:app.passportUrl},
                    {key:'certificates',label:'Certificates',icon:'fa-certificate',url:app.certificatesUrl},
                    {key:'reference',label:'Reference Letter',icon:'fa-envelope',url:app.referenceUrl},
                    {key:'medical',label:'Medical Report',icon:'fa-heart-pulse',url:app.medicalUrl}
                  ].map(d=>{
                    const hasUrl=!!d.url;
                    const st=!hasUrl?'not_uploaded':(app.documentStatus?.[d.key]||'pending_review');
                    const bc=st==='verified'?'var(--emerald-500)':st==='processing'?'var(--indigo-500)':st==='pending_review'||st==='reuploaded'?'var(--amber-500)':st==='rejected'||st==='changes_requested'||st==='upload_again'?'var(--rose-500)':st==='received'||st==='submitted'?'var(--blue-500)':'var(--slate-300)';
                    const acts=[];
                    if(hasUrl) acts.push(`<a href="${d.url}" target="_blank" class="btn btn-outline btn-sm">View</a>`);
                    if(st==='submitted') acts.push(`<button class="btn btn-outline btn-sm idxDocMarkReceived" data-dockey="${d.key}">Mark Received</button>`);
                    if(st==='received') acts.push(`<button class="btn btn-outline btn-sm idxDocStartReview" data-dockey="${d.key}">Start Review</button>`);
                    if(st==='pending_review'||st==='reuploaded'){
                      acts.push(`<button class="btn btn-outline btn-sm idxDocRequestChange" data-dockey="${d.key}"><i class="fa-solid fa-pen"></i> Request Changes</button>`);
                      acts.push(`<button class="btn btn-success btn-sm idxDocVerify" data-dockey="${d.key}"><i class="fa-solid fa-check"></i> Verify</button>`);
                      acts.push(`<button class="btn btn-primary btn-sm idxDocProcess" data-dockey="${d.key}">Processing</button>`);
                      acts.push(`<button class="btn btn-danger btn-sm idxDocReject" data-dockey="${d.key}"><i class="fa-solid fa-ban"></i> Reject</button>`);
                    }
                    if(st==='processing'){
                      acts.push(`<span class="badge badge-indigo" style="font-size:11px">⏳ Processing</span>`);
                      acts.push(`<button class="btn btn-outline btn-sm idxDocRequestChange" data-dockey="${d.key}"><i class="fa-solid fa-pen"></i> Request Changes</button>`);
                      acts.push(`<button class="btn btn-success btn-sm idxDocVerify" data-dockey="${d.key}"><i class="fa-solid fa-check"></i> Verify</button>`);
                      acts.push(`<button class="btn btn-danger btn-sm idxDocReject" data-dockey="${d.key}"><i class="fa-solid fa-ban"></i> Reject</button>`);
                    }
                    if(st==='verified'){
                      acts.push(`<span class="badge badge-green" style="font-size:11px">✅ Verified ✓</span>`);
                      acts.push(`<button class="btn btn-outline btn-sm idxDocRevoke" data-dockey="${d.key}"><i class="fa-solid fa-rotate-left"></i> Revoke</button>`);
                    }
                    if(st==='rejected') acts.push(`<button class="btn btn-outline btn-sm idxDocAllowReupload" data-dockey="${d.key}">Allow Re-upload</button>`);
                    if(st==='changes_requested'||st==='upload_again'){
                      acts.push(`<span class="badge badge-rose" style="font-size:11px">⏳ Awaiting re-upload</span>`);
                      acts.push(`<button class="btn btn-outline btn-sm idxDocCancelRequest" data-dockey="${d.key}">Cancel Request</button>`);
                    }
                    const bg=st==='verified'?'var(--emerald-50)':st==='processing'?'var(--indigo-50)':st==='rejected'||st==='changes_requested'||st==='upload_again'?'var(--rose-50)':st==='submitted'?'var(--blue-50)':'transparent';
                    return `<div class="doc-row" style="border-left:3px solid ${bc};background:${bg};border-radius:6px;padding:8px 10px;margin-bottom:6px"><div class="di"><i class="fa-solid ${d.icon}"></i> ${d.label}</div><div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">${docStatusBadge(st)}${acts.join('')}</div></div>`;
                  }).join("")}
                </div>
                <!-- Services Section -->
                <div style="margin-bottom:14px;border-top:1px solid var(--slate-200);padding-top:14px">
                  <div style="font-size:12px;color:var(--slate-500);margin-bottom:8px;font-weight:700"><i class="fa-solid fa-handshake" style="color:var(--maroon-500)"></i> Assistance Services</div>
                   <div style="display:flex;gap:10px;margin-bottom:12px;flex-wrap:wrap">
                    <div class="card pad" style="flex:1;min-width:80px;text-align:center;padding:8px"><div style="font-size:16px;font-weight:800;color:var(--blue-900)">${(app.clientServices||[]).length}</div><div style="font-size:10px;color:var(--slate-500)">Total</div></div>
                    <div class="card pad" style="flex:1;min-width:80px;text-align:center;padding:8px"><div style="font-size:16px;font-weight:800;color:var(--emerald-600)">${(app.clientServices||[]).filter(s=>s.status==='completed').length}</div><div style="font-size:10px;color:var(--slate-500)">Completed</div></div>
                    <div class="card pad" style="flex:1;min-width:80px;text-align:center;padding:8px"><div style="font-size:16px;font-weight:800;color:var(--maroon-600)">${(app.clientServices||[]).filter(s=>s.paid).reduce((s,f)=>{const p=parseAmountKES(f.amount);return s+p.kes},0).toLocaleString()}</div><div style="font-size:10px;color:var(--slate-500)">KES</div></div>
                   </div>
                   <div id="idxSvcList">${(app.clientServices||[]).length?(app.clientServices||[]).map((s,i)=>{
                    const t=SERVICE_TYPES.find(st=>st.id===s.type);
                    const ico=t?t.icon:'fa-handshake';
                    const col=t?t.color:'var(--slate-500)';
                    const svcStCls=s.status==='completed'?'badge-green':s.status==='in-progress'?'badge-amber':s.status==='cancelled'?'badge-rose':'badge-slate';
                    const svcStLbl=s.status==='pending'?'⏳ Pending':s.status==='in-progress'?'🔄 In Progress':s.status==='completed'?'✅ Completed':s.status==='cancelled'?'❌ Cancelled':'Pending';
                    return `<div style="background:var(--slate-50);border-radius:8px;padding:10px 12px;margin-bottom:8px">
                      <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
                        <span style="color:${col};font-size:14px;flex-shrink:0"><i class="fa-solid ${ico}"></i></span>
                        <div style="flex:1;min-width:100px"><div style="font-weight:700;font-size:13px;color:var(--blue-900)">${esc(s.label)}</div>${s.description?`<div style="font-size:11px;color:var(--slate-500)">${esc(s.description)}</div>`:''}</div>
                        <span class="badge ${svcStCls}" style="font-size:10px">${svcStLbl}</span>
                      </div>
                      <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-top:6px">
                        ${s.amount?`<span style="font-size:12px;color:var(--slate-500);font-weight:600">${esc(s.amount)}</span>`:''}
                        ${s.paid?`<span class="badge badge-green" style="font-size:10px">${s.paidByClient?'Client Paid':'Paid'}</span>`:`<span class="badge badge-amber" style="font-size:10px">Unpaid</span>`}${s.paidByClient?`<span style="font-size:9px;color:var(--indigo-500);font-weight:600;background:var(--indigo-50);padding:2px 6px;border-radius:3px">Client</span>`:''}${s.transactionCode?`<span style="font-size:9px;color:var(--slate-500)">${esc(s.transactionCode)}</span>`:''}
                        <span style="font-size:11px;color:var(--slate-500);font-weight:600">${s.progress||0}%</span>
                        <input type="range" min="0" max="100" value="${s.progress||0}" class="idxSvcProgress" data-svcid="${s.id}" style="flex:1;max-width:140px;height:4px">
                        <select class="idxSvcStatus" data-svcid="${s.id}" style="width:auto;min-width:90px;padding:4px 6px;font-size:11px">
                          <option value="pending" ${s.status==='pending'?'selected':''}>Pending</option>
                          <option value="in-progress" ${s.status==='in-progress'?'selected':''}>In Progress</option>
                          <option value="completed" ${s.status==='completed'?'selected':''}>Completed</option>
                          <option value="cancelled" ${s.status==='cancelled'?'selected':''}>Cancelled</option>
                        </select>
                        <button class="btn btn-xs btn-outline" data-svcpaid="${s.id}" style="font-size:10px">${s.paid?'Unmark':'Mark Paid'}</button>
                      </div>
                    </div>`;
                  }).join(""):'<div class="hint" style="margin-bottom:8px">No services assigned yet.</div>'}
                  </div>
                  <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:8px">
                    <select id="idxSvcType" style="flex:2;min-width:140px;font-size:12px">
                      <option value="">Add service...</option>
                      ${SERVICE_TYPES.map(st=>`<option value="${st.id}">${st.label}</option>`).join("")}
                    </select>
                    <input type="text" id="idxSvcAmount" placeholder="Amount" style="flex:1;min-width:80px;font-size:12px">
                    <input type="text" id="idxSvcDesc" placeholder="Description" style="flex:2;min-width:120px;font-size:12px">
                    <button class="btn btn-primary btn-sm" id="idxAddSvcBtn"><i class="fa-solid fa-plus"></i> Add</button>
                  </div>
                </div>
                <hr style="margin:20px 0;border:none;border-top:2px solid var(--slate-200)">
                <div style="margin-bottom:14px">
                  <div style="font-size:12px;color:var(--slate-500);margin-bottom:8px;font-weight:700"><i class="fa-solid fa-coins" style="color:var(--maroon-500)"></i> Fee Status</div>
                  <div style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:10px">
                    <div class="card pad" style="flex:1;min-width:100px;text-align:center;padding:10px"><div style="font-size:18px;font-weight:800;color:var(--blue-900)">${appFees.length}</div><div style="font-size:10px;color:var(--slate-500)">Items</div></div>
                    <div class="card pad" style="flex:1;min-width:100px;text-align:center;padding:10px"><div style="font-size:18px;font-weight:800;color:var(--emerald-600)">KES ${totalPaid.toLocaleString()}</div><div style="font-size:10px;color:var(--slate-500)">Paid (KES)</div></div>
                    <div class="card pad" style="flex:1;min-width:100px;text-align:center;padding:10px"><div style="font-size:18px;font-weight:800;color:var(--maroon-600)">KES ${(totalOwed-totalPaid).toLocaleString()}</div><div style="font-size:10px;color:var(--slate-500)">Outstanding (KES)</div></div>
                  </div>
                  <div style="display:flex;flex-direction:column;gap:6px">${appFees.length?appFees.map(f=>`<div style="display:flex;align-items:center;gap:8px;padding:6px 10px;background:var(--slate-50);border-radius:6px;flex-wrap:wrap;font-size:12px"><span style="flex:1;min-width:80px;font-weight:600">${esc(f.label)}</span><span style="font-weight:700;color:var(--blue-800)">${esc(f.amount)}</span><span class="badge ${f.paid?'badge-green':'badge-amber'}">${f.paid?(f.paidByClient?'Paid (Client)':'Paid'):'Unpaid'}</span>${f.paidDate?`<span style="font-size:10px;color:var(--slate-400)">${fmtDate(f.paidDate)}</span>`:''}${f.paidByClient?`<span style="font-size:9px;color:var(--indigo-500);font-weight:600;background:var(--indigo-50);padding:2px 6px;border-radius:3px">Client</span>`:''}${f.transactionCode?`<span style="font-size:9px;color:var(--slate-500)">${esc(f.transactionCode)}</span>`:''}</div>`).join(""):'<div style="padding:12px;text-align:center;color:var(--slate-400);font-size:12px">No fees recorded.</div>'}</div>
                </div>
                ${(()=>{
                  const curIdx=STATUS_STEPS.indexOf(app.status);
                  if(curIdx>=0&&curIdx<STATUS_STEPS.length-1&&!TERMINAL_ALT.includes(app.status)){
                    const _dv=k=>app.documentStatus?.[k]==='verified'||!!app.documentsVerified?.[k];
                    const allVerified=_dv('cv')&&_dv('passport');
                    if(allVerified){
                      return `<div style="background:var(--emerald-50);border:1px solid #bfe6cc;border-radius:8px;padding:10px 14px;margin-bottom:14px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px"><span style="font-size:13px;font-weight:600;color:#065F46"><i class="fa-solid fa-circle-check" style="color:var(--emerald-600)"></i> All requirements met</span><button class="btn btn-success btn-sm" id="indexAutoAdvance">Advance to "${esc(STATUS_STEPS[curIdx+1])}"</button></div>`;
                    }
                  }
                  return '';
                })()}
                <div style="margin-bottom:14px">
                  <div style="font-size:12px;color:var(--slate-500);margin-bottom:8px;font-weight:700">Update Status</div>
                  <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px">
                    ${(()=>{
                      const curIdx=STATUS_STEPS.indexOf(app.status);
                      const chips=[];
                      STATUS_STEPS.forEach((s,i)=>{
                        if(i<curIdx) chips.push(`<span class="chip done" style="opacity:.5;pointer-events:none;background:var(--emerald-100);color:var(--emerald-700)"><i class="fa-solid fa-check"></i> ${esc(s)}</span>`);
                        else if(i===curIdx) chips.push(`<span class="chip active" style="background:var(--maroon-500);color:#fff">${esc(s)}</span>`);
                        else chips.push(`<span class="chip" style="cursor:pointer;border:1.5px dashed var(--slate-300)" data-setstatus="${esc(s)}">${esc(s)}</span>`);
                      });
                      TERMINAL_ALT.forEach(s=>{
                        const isActive=s===app.status;
                        chips.push(`<span class="chip ${isActive?'active':''}" style="${isActive?'background:var(--rose-600);color:#fff':'border:1.5px dashed var(--rose-300);color:var(--rose-700);cursor:pointer'}" data-setstatus="${esc(s)}">${esc(s)}</span>`);
                      });
                      return chips.join(' ');
                    })()}
                  </div>
                  <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center">
                    <input type="text" id="statusNote" placeholder="Optional note for this status change..." style="flex:1;min-width:180px">
                    <button class="btn btn-primary btn-sm" id="applyStatusBtn"><i class="fa-solid fa-arrows-rotate"></i> Update</button>
                  </div>
                </div>
                <div>
                  <div style="font-size:12px;color:var(--slate-500);margin-bottom:8px;font-weight:700">Internal Notes</div>
                  <div id="internalNotesList" style="margin-bottom:10px">${(app.internalNotes || []).length ? app.internalNotes.map(n => `<div class="tl-note" style="margin-bottom:8px"><b>${esc(n.author)}</b> · ${fmtDate(n.createdAt||n.date)}<br>${esc(n.text||n.note)}</div>`).join("") : `<div class="hint">No internal notes yet.</div>`}</div>
                  <div style="display:flex;gap:10px"><input type="text" id="newNote" placeholder="Add an internal note..."><button class="btn btn-outline btn-sm" id="addNoteBtn">Add</button></div>
                </div>
                <hr style="margin:20px 0;border:none;border-top:2px solid var(--slate-200)">
                <div>
                  <div style="font-size:12px;color:var(--slate-500);margin-bottom:8px;font-weight:700"><i class="fa-solid fa-timeline" style="color:var(--maroon-500)"></i> Application Timeline</div>
                  ${renderTimeline(app)}
                </div>
              </div>
              <div class="modal-foot" style="flex-wrap:wrap">
                <button class="btn ${app.blocked?'btn-success':'btn-danger'} btn-sm" id="indexBlockBtn"><i class="fa-solid ${app.blocked?'fa-unlock':'fa-ban'}"></i> ${app.blocked?'Unblock':'Block'} Account</button>
                <button class="btn btn-primary btn-sm" data-startchat="${app.uid}" data-chatname="${app.fullName}"><i class="fa-solid fa-comment-dots"></i> Chat</button>
                <button class="btn btn-outline" id="archiveBtn"><i class="fa-solid fa-box-archive"></i> Archive</button>
                <button class="btn btn-danger btn-sm" id="indexDeleteAppBtn"><i class="fa-solid fa-trash-can"></i> Delete</button>
                <button class="btn btn-outline" id="modalCloseBtn2">Close</button>
              </div>
            </div>
          </div>`;

            document.getElementById('modalCloseBtn').addEventListener('click', closeModal);
            document.getElementById('modalCloseBtn2').addEventListener('click', closeModal);
            document.getElementById('modalOverlay').addEventListener('click', (e) => { if (e.target.id === 'modalOverlay') closeModal(); });
            const appIdKey = app.id || app.uid;

            // Document action handlers
            document.querySelectorAll('.idxDocVerify').forEach(b=>b.addEventListener('click',async function(){
                const key=this.getAttribute('data-dockey'); const fresh=await getApp(appIdKey);
                const ds={...(fresh?.documentStatus||{}),[key]:'verified'};
                await updateApp(appIdKey,{documentStatus:ds});
                notifyApplicant(app.uid,app.fullName,`✅ Document "${key.toUpperCase()}" has been verified.`);
                try{addAuditLog(`Document verified: ${key}`,displayName(app),appIdKey);}catch(e){}
                toast(`"${key}" verified.`,"ok"); await loadApps(); openAdminAppModal(appIdKey);
            }));
            document.querySelectorAll('.idxDocRequestChange').forEach(b=>b.addEventListener('click',async function(){
                const key=this.getAttribute('data-dockey'); const fresh=await getApp(appIdKey);
                const ds={...(fresh?.documentStatus||{}),[key]:'changes_requested'};
                await updateApp(appIdKey,{documentStatus:ds});
                notifyApplicant(app.uid,app.fullName,`📝 Document "${key.toUpperCase()}": Changes requested. Please upload a revised version.`);
                try{addAuditLog(`Changes requested: ${key}`,displayName(app),appIdKey);}catch(e){}
                toast(`Changes requested for "${key}".`,"ok"); await loadApps(); openAdminAppModal(appIdKey);
            }));
            document.querySelectorAll('.idxDocRevoke').forEach(b=>b.addEventListener('click',async function(){
                const key=this.getAttribute('data-dockey'); const fresh=await getApp(appIdKey);
                const ds={...(fresh?.documentStatus||{}),[key]:'pending_review'};
                await updateApp(appIdKey,{documentStatus:ds});
                notifyApplicant(app.uid,app.fullName,`🔄 Document "${key.toUpperCase()}" verification has been revoked.`);
                try{addAuditLog(`Verification revoked: ${key}`,displayName(app),appIdKey);}catch(e){}
                toast(`Verification revoked for "${key}".`,"ok"); await loadApps(); openAdminAppModal(appIdKey);
            }));
            document.querySelectorAll('.idxDocCancelRequest').forEach(b=>b.addEventListener('click',async function(){
                const key=this.getAttribute('data-dockey'); const fresh=await getApp(appIdKey);
                const ds={...(fresh?.documentStatus||{}),[key]:'pending_review'};
                await updateApp(appIdKey,{documentStatus:ds});
                notifyApplicant(app.uid,app.fullName,`📝 Change request cancelled for document "${key.toUpperCase()}".`);
                try{addAuditLog(`Change request cancelled: ${key}`,displayName(app),appIdKey);}catch(e){}
                toast(`Change request cancelled for "${key}".`,"ok"); await loadApps(); openAdminAppModal(appIdKey);
            }));
            document.querySelectorAll('.idxDocMarkReceived').forEach(b=>b.addEventListener('click',async function(){
                const key=this.getAttribute('data-dockey'); const fresh=await getApp(appIdKey);
                const ds={...(fresh?.documentStatus||{}),[key]:'received'};
                await updateApp(appIdKey,{documentStatus:ds});
                notifyApplicant(app.uid,app.fullName,`📄 Document "${key.toUpperCase()}" has been received and is under review.`);
                try{addAuditLog(`Document received: ${key}`,displayName(app),appIdKey);}catch(e){}
                toast(`"${key}" marked as received.`,"ok"); await loadApps(); openAdminAppModal(appIdKey);
            }));
            document.querySelectorAll('.idxDocStartReview').forEach(b=>b.addEventListener('click',async function(){
                const key=this.getAttribute('data-dockey'); const fresh=await getApp(appIdKey);
                const ds={...(fresh?.documentStatus||{}),[key]:'pending_review'};
                await updateApp(appIdKey,{documentStatus:ds});
                notifyApplicant(app.uid,app.fullName,`🔍 Document "${key.toUpperCase()}" is now under review.`);
                try{addAuditLog(`Review started: ${key}`,displayName(app),appIdKey);}catch(e){}
                toast(`"${key}" moved to review.`,"ok"); await loadApps(); openAdminAppModal(appIdKey);
            }));
            document.querySelectorAll('.idxDocProcess').forEach(b=>b.addEventListener('click',async function(){
                const key=this.getAttribute('data-dockey'); const fresh=await getApp(appIdKey);
                const ds={...(fresh?.documentStatus||{}),[key]:'processing'};
                await updateApp(appIdKey,{documentStatus:ds});
                notifyApplicant(app.uid,app.fullName,`⚙️ Document "${key.toUpperCase()}" is being processed.`);
                try{addAuditLog(`Document processing: ${key}`,displayName(app),appIdKey);}catch(e){}
                toast(`"${key}" set to processing.`,"ok"); await loadApps(); openAdminAppModal(appIdKey);
            }));
            document.querySelectorAll('.idxDocReject').forEach(b=>b.addEventListener('click',async function(){
                const key=this.getAttribute('data-dockey'); const fresh=await getApp(appIdKey);
                const ds={...(fresh?.documentStatus||{}),[key]:'rejected'};
                await updateApp(appIdKey,{documentStatus:ds});
                notifyApplicant(app.uid,app.fullName,`❌ Document "${key.toUpperCase()}" has been rejected. Please upload a new version from your portal.`);
                try{addAuditLog(`Document rejected: ${key}`,displayName(app),appIdKey);}catch(e){}
                toast(`"${key}" rejected.`,"ok"); await loadApps(); openAdminAppModal(appIdKey);
            }));
            document.querySelectorAll('.idxDocAllowReupload').forEach(b=>b.addEventListener('click',async function(){
                const key=this.getAttribute('data-dockey'); const fresh=await getApp(appIdKey);
                const ds={...(fresh?.documentStatus||{}),[key]:'upload_again'};
                await updateApp(appIdKey,{documentStatus:ds});
                notifyApplicant(app.uid,app.fullName,`📤 Document "${key.toUpperCase()}": You may now upload a new version.`);
                try{addAuditLog(`Re-upload allowed: ${key}`,displayName(app),appIdKey);}catch(e){}
                toast(`Re-upload allowed for "${key}".`,"ok"); await loadApps(); openAdminAppModal(appIdKey);
            }));
            // Status chip click
            let selectedStatus=null;
            document.querySelectorAll('[data-setstatus]').forEach(b=>b.addEventListener('click',function(){
                document.querySelectorAll('[data-setstatus]').forEach(x=>x.classList.remove('active'));
                this.classList.add('active'); selectedStatus=this.getAttribute('data-setstatus');
            }));
            // Services wire
            document.querySelectorAll('.idxSvcProgress').forEach(sl=>sl.addEventListener('input',async function(){
                const svcId=this.getAttribute('data-svcid'); const val=parseInt(this.value);
                const fresh=await getApp(appIdKey); const svcs=[...(fresh?.clientServices||[])]; const idx=svcs.findIndex(s=>s.id===svcId); if(idx<0)return;
                svcs[idx].progress=val; svcs[idx].updatedAt=new Date().toISOString();
                await updateApp(appIdKey,{clientServices:svcs});
            }));
            document.querySelectorAll('.idxSvcStatus').forEach(sel=>sel.addEventListener('change',async function(){
                const svcId=this.getAttribute('data-svcid'); const newStatus=this.value;
                const fresh=await getApp(appIdKey); const svcs=[...(fresh?.clientServices||[])]; const idx=svcs.findIndex(s=>s.id===svcId); if(idx<0)return;
                const old=svcs[idx].status; svcs[idx].status=newStatus; svcs[idx].updatedAt=new Date().toISOString();
                await updateApp(appIdKey,{clientServices:svcs});
                try{notifyApplicant(app.uid,app.fullName,`🛎️ Service Update: "${svcs[idx].label}" → ${newStatus}${old!=='none'?` (was: ${old})`:''}`);}catch(e){}
                try{addAuditLog(`Service status: "${svcs[idx].label}" → ${newStatus}`,`${displayName(app)}`,appIdKey);}catch(e){}
                toast(`"${svcs[idx].label}" → ${newStatus}.`,"ok"); await loadApps(); openAdminAppModal(appIdKey);
            }));
            document.querySelectorAll('[data-svcpaid]').forEach(b=>b.addEventListener('click',async function(){
                const svcId=this.getAttribute('data-svcpaid');
                const fresh=await getApp(appIdKey); const svcs=[...(fresh?.clientServices||[])]; const idx=svcs.findIndex(s=>s.id===svcId); if(idx<0)return;
                svcs[idx].paid=!svcs[idx].paid; svcs[idx].paidDate=svcs[idx].paid?new Date().toISOString():null; svcs[idx].updatedAt=new Date().toISOString();
                await updateApp(appIdKey,{clientServices:svcs});
                try{notifyApplicant(app.uid,app.fullName,`💰 Payment ${svcs[idx].paid?'received':'unmarked'} for service "${svcs[idx].label}".`);}catch(e){}
                try{addAuditLog(`Service payment ${svcs[idx].paid?'paid':'unpaid'}`,`${displayName(app)} — ${svcs[idx].label}`,appIdKey);}catch(e){}
                toast(`Payment ${svcs[idx].paid?'marked':'unmarked'}.`,"ok"); await loadApps(); openAdminAppModal(appIdKey);
            }));
            document.getElementById('idxAddSvcBtn')?.addEventListener('click',async()=>{
                const type=document.getElementById('idxSvcType').value; if(!type){toast("Select a service type.","err");return;}
                const svcType=SERVICE_TYPES.find(st=>st.id===type); const label=svcType?svcType.label:'Service';
                const amount=document.getElementById('idxSvcAmount').value.trim(); const desc=document.getElementById('idxSvcDesc').value.trim();
                const fresh=await getApp(appIdKey); const svcs=[...(fresh?.clientServices||[])];
                svcs.push({id:'svc_'+Date.now(),type,label,amount:amount||'',description:desc||'',status:'pending',paid:false,paidDate:null,progress:0,createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()});
                await updateApp(appIdKey,{clientServices:svcs});
                try{notifyApplicant(app.uid,app.fullName,`🛎️ New service added: "${label}"${amount?` (${amount})`:''}`);}catch(e){}
                try{addAuditLog(`Service added: "${label}"`,`${displayName(app)}`,appIdKey);}catch(e){}
                toast(`Service "${label}" added.`,"ok"); await loadApps(); openAdminAppModal(appIdKey);
            });
            document.getElementById('indexAutoAdvance')?.addEventListener('click', async () => {
                const curIdx = STATUS_STEPS.indexOf(app.status);
                const next = STATUS_STEPS[curIdx + 1];
                if (!next) { toast("Already at final stage.", "err"); return; }
                const timeline = [...(app.timeline || []), { status: next, date: new Date().toISOString(), note: `Auto-advanced: all requirements met for "${app.status}".` }];
                await updateApp(appIdKey, { status: next, timeline });
                notifyApplicant(app.uid,app.fullName,`📋 Status update: ${next} — All requirements for the previous stage were verified.`);
                simulateEmail(app.email, `Application Status Update – ${next}`,
                    `Dear ${app.fullName},\n\nYour application (${displayId(app)}) status has been updated to: ${next}.\n\nAll requirements for the previous stage were verified.\n\nLog in to your portal for more details.\n\nBest regards,\nEurope Sponsor Jobs Team`);
                toast(`Auto-advanced to "${next}".`, "ok"); await loadApps(); openAdminAppModal(appIdKey);
            });
            document.getElementById('applyStatusBtn').addEventListener('click', async () => {
                const chip=document.querySelector('[data-setstatus].active');
                const newStatus=chip?chip.getAttribute('data-setstatus'):null;
                if(!newStatus||newStatus===app.status){toast("Select a different status first.","err");return;}
                const curIdx=STATUS_STEPS.indexOf(app.status);
                const newIdx=STATUS_STEPS.indexOf(newStatus);
                if(newIdx>=0&&newIdx<curIdx){toast("Cannot go back to a previous step.","err");return;}
                const note = document.getElementById('statusNote').value.trim();
                const fresh = await getApp(appIdKey);
                const entry = { status: newStatus, date: new Date().toISOString() };
                if (note) entry.note = note;
                const timeline = [...(fresh?.timeline || []), entry];
                await updateApp(appIdKey, { status: newStatus, timeline });
                try{addAuditLog(`Status → ${newStatus}`,`${displayName(app)} (${displayId(app)})`,appIdKey);}catch(e){}
                notifyApplicant(app.uid,app.fullName,`📋 Status update: ${newStatus}${note?` — ${note}`:''}`);
                simulateEmail(app.email, `Application Status Update – ${newStatus}`,
                    `Dear ${app.fullName},\n\nYour application (${displayId(app)}) status has been updated to: ${newStatus}.\n\n${note ? 'Note: ' + note : ''}\n\nLog in to your portal for more details.\n\nBest regards,\nEurope Sponsor Jobs Team`);
                toast(`Status updated to "${newStatus}".`, "ok"); await loadApps(); openAdminAppModal(appIdKey);
            });
            document.getElementById('addNoteBtn').addEventListener('click', async () => {
                const val = document.getElementById('newNote').value.trim();
                if (!val) return;
                const fresh = await getApp(appIdKey);
                const internalNotes = [...(fresh?.internalNotes || []), { id: 'n_'+Date.now(), text: val, author: currentUserData?.email || currentUser?.email || 'admin', createdAt: new Date().toISOString() }];
                await updateApp(appIdKey, { internalNotes });
                toast("Internal note added.", "ok"); await loadApps(); openAdminAppModal(appIdKey);
            });
            document.getElementById('archiveBtn').addEventListener('click', async () => {
                if (confirm("Archive this application?")) { await updateApp(appIdKey, { archived: true }); try{addAuditLog(`Application archived`,displayName(app),appIdKey);}catch(e){} toast("Application archived.", "ok"); loadApps(); closeModal(); }
            });
            document.getElementById('indexBlockBtn').addEventListener('click', async () => {
                const email = app.email || '';
                const name = app.fullName || 'this user';
                if (app.blocked) {
                    if (!confirm(`UNBLOCK ${name} (${email})? They will regain platform access.`)) return;
                    await updateApp(appIdKey, { blocked: false, blockedAt: null, blockedBy: null });
                    try{addAuditLog(`Unblocked account`,`${name} (${email})`,appIdKey);}catch(e){}
                    toast(`✅ ${name} unblocked.`, "ok");
                } else {
                    if (!confirm(`BLOCK ${name} (${email})? They will be unable to access the platform.`)) return;
                    if (!confirm(`⚠️ CONFIRM BLOCK? This cannot be undone without admin intervention.`)) return;
                    await updateApp(appIdKey, { blocked: true, blockedAt: new Date().toISOString(), blockedBy: currentUserData?.email || 'Admin' });
                    try{addAuditLog(`Blocked account`,`${name} (${email})`,appIdKey);}catch(e){}
                    toast(`🔇 ${name} blocked.`, "ok");
                }
                await loadApps(); openAdminAppModal(appIdKey);
            });
            document.getElementById('indexDeleteAppBtn')?.addEventListener('click', async () => {
                if (!confirm(`⚠️ DELETE application for ${app.fullName || 'this user'} (${displayId(app)})? This permanently removes ALL data including documents, chats, and messages. Cannot be undone.`)) return;
                if (!confirm(`FINAL CONFIRMATION: Delete ${app.fullName || 'this user'}'s application forever?`)) return;
                try {
                    const id = app.id || app.uid;
                    if (id) await deleteDoc(doc(db, "applications", id)).catch(() => {});
                    const chatsSnap = await getDocs(query(collection(db,"chats"), where("participants","array-contains",app.uid)));
                    await Promise.allSettled(chatsSnap.docs.map(async cd=>{
                        const msgsSnap = await getDocs(collection(db,"chats",cd.id,"messages"));
                        await Promise.allSettled(msgsSnap.docs.map(m=>m.ref.delete().catch(()=>{})));
                        await cd.ref.delete().catch(()=>{});
                    }));
                    try{addAuditLog(`Deleted application`,`${displayName(app)} (${displayId(app)})`);}catch(e){}
                    toast("Application permanently deleted.","ok");
                    loadApps(); closeModal();
                } catch(e) { toast("Delete error: "+e.message,"err"); }
            });
            document.querySelectorAll('[data-startchat]').forEach(el => {
                el.addEventListener('click', async () => {
                    const otherUid = el.getAttribute('data-startchat');
                    const otherName = el.getAttribute('data-chatname') || otherUid;
                    closeModal();
                    if (!currentUser) { toast("Please log in first.", "err"); return; }
                    const chat = await getOrCreateChat(otherUid, otherName);
                    if (chat) navigate("messages-chat", { chatId: chat.id, otherName });
                });
            });
            // Disable action buttons on click to prevent double-submit
            document.querySelectorAll('[class*="Btn"],[class*="btn"]').forEach(b=>b.addEventListener('click',function(){if(!this.disabled)setTimeout(()=>this.disabled=true)}));
        }

        function closeModal() { document.getElementById('modal-root').innerHTML = ""; }

        function viewAdminJobs() {
            if (!currentUser || !currentUserData || currentUserData.type !== 'admin') return `<div class="section"><div class="wrap"><div class="empty-state"><i class="fa-solid fa-lock"></i><p>Admin access required.</p></div></div></div>`;
            const jobs = allJobs;
            const pgj = pgSlice('ajobs', jobs);
            return `
          <div class="dash-shell">
            <div class="dash-side">
              <div class="side-title">Admin Console</div>
              <a class="side-link" data-nav="admin-dashboard"><i class="fa-solid fa-gauge"></i> Applications</a>
              <a class="side-link active"><i class="fa-solid fa-briefcase"></i> Manage Jobs</a>
              <a class="side-link" data-nav="admin-fees"><i class="fa-solid fa-coins"></i> Fee Structure</a>
              <a class="side-link" data-nav="admin-finance"><i class="fa-solid fa-chart-line"></i> Finance</a>
              <a class="side-link" data-nav="messages"><i class="fa-solid fa-comment-dots"></i> Messages ${getUnreadCount() ? `<span class="msg-count">${getUnreadCount()}</span>` : ''}</a>
              <div class="side-title" style="margin-top:20px">Account</div>
              <a class="side-link" data-action="logout"><i class="fa-solid fa-right-from-bracket"></i> Log Out</a>
            </div>
            <div class="dash-main">
              <div class="dash-topbar"><h2>Manage Job Listings</h2></div>
              ${usingFallbackJobs ? `<div style="background:#FEF3E2;border:1px solid #FCDEA8;border-radius:8px;padding:14px 18px;margin-bottom:16px;font-size:13px;color:#92400E"><b><i class="fa-solid fa-triangle-exclamation"></i> Offline / Fallback Mode</b> — Jobs are loaded from embedded data because Firestore is unavailable. Log in as admin with proper <a href="https://console.firebase.google.com/project/tuchel-98f49/firestore/rules" target="_blank" style="text-decoration:underline;font-weight:600">Firestore security rules</a> to enable database operations.</div>` : ''}
              <div class="card pad" style="margin-bottom:22px">
                <h4 style="margin:0 0 14px;color:var(--blue-900)">Add New Job</h4>
                <form id="newJobForm">
                  <div class="field-row">
                    <div class="field"><label>Job Title <span class="req">*</span></label><input type="text" name="title" required></div>
                    <div class="field"><label>Country <span class="req">*</span></label><select name="country" required>${COUNTRIES.map(c => `<option>${c}</option>`).join("")}</select></div>
                  </div>
                  <div class="field-row">
                    <div class="field"><label>Category <span class="req">*</span></label><select name="category" required>${CATEGORIES.map(c => `<option>${c}</option>`).join("")}</select></div>
                    <div class="field"><label>Salary <span class="req">*</span></label><input type="text" name="salary" placeholder="e.g. EUR 2,000 – 2,600 / month" required></div>
                  </div>
                  <div class="field"><label>Description <span class="req">*</span></label><textarea name="desc" required></textarea></div>
                  <div style="display:flex;gap:10px;flex-wrap:wrap">
                    <button class="btn btn-primary" type="submit"><i class="fa-solid fa-plus"></i> Add Job</button>
                    <button class="btn btn-success" type="button" id="seedJobsBtn"><i class="fa-solid fa-seedling"></i> Seed ${JOBS_SEED.length} Sample Jobs</button>
                    <button class="btn btn-danger" type="button" id="clearJobsBtn"><i class="fa-solid fa-trash-can"></i> Clear All Jobs</button>
                  </div>
                </form>
              </div>
              <div style="margin-bottom:16px;display:flex;gap:10px;flex-wrap:wrap;align-items:center">
                <span style="font-size:13px;color:var(--slate-500)"><b>${jobs.length}</b> job${jobs.length !== 1 ? 's' : ''} currently in database</span>
              </div>
              <div class="card">
                <div class="table-wrap">
                <table>
                  <thead><tr><th class="rnum">#</th><th>Title</th><th>Country</th><th>Category</th><th>Salary</th><th></th><th class="rnum">#</th></tr></thead>
                  <tbody>
                    ${jobs.length ? pgj.items.map((j,ji) => `
                      <tr>
                        <td class="rnum">${pgj.start+ji+1}</td>
                        <td><b>${esc(j.title)}</b></td>
                        <td>${esc(j.country)}</td>
                        <td>${esc(j.category)}</td>
                        <td>${esc(j.salary)}</td>
                        <td><button class="btn btn-danger btn-sm" data-deljob="${j.id}"><i class="fa-solid fa-trash"></i></button></td>
                        <td class="rnum">${pgj.start+ji+1}</td>
                      </tr>`).join("") : `<tr><td colspan="7"><div class="empty-state"><i class="fa-solid fa-briefcase"></i><p>No jobs added yet. Click "Seed Sample Jobs" to populate instantly.</p></div></td></tr>`}
                  </tbody>
                </table>
                  </div>
                  ${pgBar('ajobs', pgj)}
                </div>
            </div>
          </div>`;
        }

        function wireAdminJobs() {
            const f = document.getElementById('newJobForm');
            if (f) f.addEventListener('submit', async (e) => {
                e.preventDefault();
                const fd = new FormData(e.target);
                await addJob({ title: fd.get('title'), country: fd.get('country'), category: fd.get('category'), salary: fd.get('salary'), desc: fd.get('desc') });
                toast("Job listing added.", "ok"); renderCurrentView();
            });
            document.querySelectorAll('[data-deljob]').forEach(b => b.addEventListener('click', async () => {
                if (confirm("Remove this job listing?")) { await deleteJob(b.getAttribute('data-deljob')); toast("Job listing removed.", "ok"); renderCurrentView(); }
            }));
            const seedBtn = document.getElementById('seedJobsBtn');
            if (seedBtn) seedBtn.addEventListener('click', seedAllJobs);
            const clearBtn = document.getElementById('clearJobsBtn');
            if (clearBtn) clearBtn.addEventListener('click', clearAllJobs);
        }

        async function seedAllJobs() {
            if (!confirm(`Add ${JOBS_SEED.length} sample jobs to the database? Existing jobs will remain - duplicates may occur.`)) return;
            const btn = document.getElementById('seedJobsBtn');
            btn.disabled = true; btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Seeding...';
            const batchSize = 20;
            let added = 0;
            for (let i = 0; i < JOBS_SEED.length; i += batchSize) {
                const chunk = JOBS_SEED.slice(i, i + batchSize);
                const results = await Promise.allSettled(chunk.map(j => addJob(j)));
                added += results.filter(r => r.status === 'fulfilled').length;
            }
            await loadJobs();
            toast(`✅ ${added} jobs seeded${added < JOBS_SEED.length ? `, ${JOBS_SEED.length - added} failed` : ''}!`, added < JOBS_SEED.length ? 'err' : 'ok');
            btn.disabled = false; btn.innerHTML = '<i class="fa-solid fa-seedling"></i> Seed Sample Jobs';
            renderCurrentView();
        }

        async function clearAllJobs() {
            if (!confirm('DELETE ALL jobs from the database? This cannot be undone!')) return;
            if (!confirm('ARE YOU SURE? Every job listing will be permanently removed.')) return;
            const btn = document.getElementById('clearJobsBtn');
            btn.disabled = true; btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Clearing...';
            let deleted = 0;
            for (const job of allJobs) {
                if (job.id && job.id.startsWith('fallback_')) continue;
                try {
                    await deleteDoc(doc(db, "jobs", job.id));
                    deleted++;
                } catch (e) { console.error("Failed to delete:", job.id, e); }
            }
            allJobs = [];
            toast(`🗑️ ${deleted} jobs cleared!`, 'ok');
            btn.disabled = false; btn.innerHTML = '<i class="fa-solid fa-trash-can"></i> Clear All Jobs';
            renderCurrentView();
        }

        let autoSeedAttempted = false;
        async function autoSeedJobsIfEmpty() {
            if (autoSeedAttempted) return;
            autoSeedAttempted = true;
            if (usingFallbackJobs) {
                console.log("🌱 Using embedded fallback data — Firestore seeding not available.");
                return;
            }
            if (allJobs.length > 0) return;
            console.log("🌱 Jobs empty in Firestore — auto-seeding from JOBS_SEED...");
            const results = await Promise.allSettled(JOBS_SEED.map(j => addJob(j)));
            const added = results.filter(r => r.status === 'fulfilled').length;
            const failed = results.length - added;
            await loadJobs();
            if (added > 0) {
                console.log(`✅ Auto-seeded ${added} jobs${failed ? ` (${failed} failed)` : ''}`);
                renderCurrentView();
            } else if (failed > 0) {
                console.warn("⚠️ Could not auto-seed jobs — Firestore rules may require authentication.");
            }
        }

        function viewAdminFees() {
            if (!currentUser || !currentUserData || currentUserData.type !== 'admin') return `<div class="section"><div class="wrap"><div class="empty-state"><i class="fa-solid fa-lock"></i><p>Admin access required.</p></div></div></div>`;
            const fees = allFees;
            const pgf = pgSlice('afees', fees);
            return `
          <div class="dash-shell">
            <div class="dash-side">
              <div class="side-title">Admin Console</div>
              <a class="side-link" data-nav="admin-dashboard"><i class="fa-solid fa-gauge"></i> Applications</a>
              <a class="side-link" data-nav="admin-jobs"><i class="fa-solid fa-briefcase"></i> Manage Jobs</a>
              <a class="side-link active"><i class="fa-solid fa-coins"></i> Fee Structure</a>
              <a class="side-link" data-nav="admin-finance"><i class="fa-solid fa-chart-line"></i> Finance</a>
              <a class="side-link" data-nav="messages"><i class="fa-solid fa-comment-dots"></i> Messages ${getUnreadCount() ? `<span class="msg-count">${getUnreadCount()}</span>` : ''}</a>
              <div class="side-title" style="margin-top:20px">Account</div>
              <a class="side-link" data-action="logout"><i class="fa-solid fa-right-from-bracket"></i> Log Out</a>
            </div>
            <div class="dash-main">
              <div class="dash-topbar"><h2>Fee Structure Management</h2></div>
              <div class="card pad" style="margin-bottom:22px">
                <h4 style="margin:0 0 14px;color:var(--blue-900)">Add Fee Item</h4>
                <form id="newFeeForm">
                  <div class="field-row">
                    <div class="field"><label>Fee Label <span class="req">*</span></label><input type="text" name="label" placeholder="e.g. Visa Sponsorship Processing" required></div>
                    <div class="field"><label>Amount <span class="req">*</span></label><input type="text" name="amount" placeholder="e.g. EUR 0 or Varies" required></div>
                  </div>
                  <div class="field-row">
                    <div class="field"><label>Paid By <span class="req">*</span></label>
                      <select name="paidBy" required><option value="Employer">Employer</option><option value="Employer/Shared">Employer/Shared</option><option value="Worker">Worker</option></select>
                    </div>
                    <div class="field"><label>Description</label><input type="text" name="desc" placeholder="Brief description"></div>
                  </div>
                  <button class="btn btn-primary" type="submit"><i class="fa-solid fa-plus"></i> Add Fee</button>
                </form>
              </div>
              <div class="card">
                <div class="table-wrap">
                <table>
                  <thead><tr><th class="rnum">#</th><th>Label</th><th>Amount</th><th>Paid By</th><th>Description</th><th></th><th class="rnum">#</th></tr></thead>
                  <tbody>
                    ${fees.length ? pgf.items.map((f,fi) => `
                      <tr>
                        <td class="rnum">${pgf.start+fi+1}</td>
                        <td><b>${esc(f.label)}</b></td>
                        <td>${esc(f.amount)}</td>
                        <td>${esc(f.paidBy)}</td>
                        <td>${esc(f.desc || '—')}</td>
                        <td><button class="btn btn-danger btn-sm" data-delfee="${f.id}"><i class="fa-solid fa-trash"></i></button></td>
                        <td class="rnum">${pgf.start+fi+1}</td>
                      </tr>`).join("") : `<tr><td colspan="7"><div class="empty-state"><i class="fa-solid fa-coins"></i><p>No fee items added yet.</p></div></td></tr>`}
                  </tbody>
                </table>
                  </div>
                  ${pgBar('afees', pgf)}
                </div>
            </div>
          </div>`;
        }

        function wireAdminFees() {
            const f = document.getElementById('newFeeForm');
            if (f) f.addEventListener('submit', async (e) => {
                e.preventDefault();
                const fd = new FormData(e.target);
                await addFee({ label: fd.get('label'), amount: fd.get('amount'), paidBy: fd.get('paidBy'), desc: fd.get('desc') || '' });
                toast("Fee item added.", "ok"); renderCurrentView();
            });
            document.querySelectorAll('[data-delfee]').forEach(b => b.addEventListener('click', async () => {
                if (confirm("Remove this fee item?")) { await deleteFee(b.getAttribute('data-delfee')); toast("Fee item removed.", "ok"); renderCurrentView(); }
            }));
        }

        const EUR_TO_KES = 150;
        const USD_TO_KES = 128;

        function parseAmountKES(raw) {
            if (!raw) return { kes: 0, orig: '0', currency: 'KES' };
            const s = String(raw);
            let num = parseFloat(s.replace(/[^0-9.]/g,'')) || 0;
            let currency = 'EUR';
            if (/€|EUR|eur/i.test(s)) currency = 'EUR';
            else if (/\$|USD|usd/i.test(s)) currency = 'USD';
            else if (/KES|kes|Ksh|ksh|\/=/i.test(s)) currency = 'KES';
            const rate = currency === 'USD' ? USD_TO_KES : currency === 'KES' ? 1 : EUR_TO_KES;
            return { kes: Math.round(num * rate), orig: s, currency, num };
        }

        function viewAdminFinance() {
            if (!currentUser || !currentUserData || currentUserData.type !== 'admin') return `<div class="section"><div class="wrap"><div class="empty-state"><i class="fa-solid fa-lock"></i><p>Admin access required.</p></div></div></div>`;
            const apps = allApps.filter(a => !a.deleted);
            let allTxns = [];
            apps.forEach(a => {
                (a.fees||[]).forEach(f => {
                    const p = parseAmountKES(f.amount);
                    allTxns.push({ id:f.id||'', type:'fee', label:f.label||'Fee', amountKES:p.kes, amountOrig:p.orig, currency:p.currency, paid:!!f.paid, paidDate:f.paidDate||null, paymentMethod:f.paymentMethod||'mpesa', transactionCode:f.transactionCode||'', paidByClient:f.paidByClient||'', clientName:a.fullName||'', clientId:a.id||'', clientUid:a.uid||'', country:a.country||'', clientStatus:a.archived?'archived':a.blocked?'blocked':'active', status:f.paid?'paid':(f.status||'pending') });
                });
                (a.clientServices||[]).forEach(s => {
                    const p = parseAmountKES(s.amount);
                    allTxns.push({ id:s.id||'', type:'service', label:s.label||'Service', amountKES:p.kes, amountOrig:p.orig, currency:p.currency, paid:!!s.paid, paidDate:s.paidDate||null, paymentMethod:s.paymentMethod||'mpesa', transactionCode:s.transactionCode||'', paidByClient:s.paidByClient||'', clientName:a.fullName||'', clientId:a.id||'', clientUid:a.uid||'', country:a.country||'', clientStatus:a.archived?'archived':a.blocked?'blocked':'active', status:s.paid?'paid':(s.status||'pending') });
                });
            });
            let totalDue=0,totalPaid=0,totalPending=0,totalCancelled=0,totalRefunded=0;
            const revByMonth={},revByCountry={},revByMethod={},dist={paid:0,pending:0,cancelled:0,refunded:0};
            allTxns.forEach(t => {
                const a=t.amountKES; totalDue+=a;
                if(t.status==='paid'){totalPaid+=a;dist.paid+=a}
                else if(t.status==='cancelled'){totalCancelled+=a;dist.cancelled+=a}
                else if(t.status==='refunded'){totalRefunded+=a;dist.refunded+=a}
                else{totalPending+=a;dist.pending+=a}
                if(t.paid&&t.paidDate){
                    const d=new Date(t.paidDate);
                    if(!isNaN(d)){const k=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0');revByMonth[k]=(revByMonth[k]||0)+a}
                    const c=t.country||'Unknown';revByCountry[c]=(revByCountry[c]||0)+a;
                    const m=t.paymentMethod||'other';revByMethod[m]=(revByMethod[m]||0)+a;
                }
            });
            const activeClients=new Set(apps.filter(x=>!x.archived&&!x.blocked&&!x.deleted).map(x=>x.uid)).size;
            const archivedClients=new Set(apps.filter(x=>x.archived).map(x=>x.uid)).size;
            const blockedClients=new Set(apps.filter(x=>x.blocked).map(x=>x.uid)).size;
            const txnCount=allTxns.length;
            const fmKES=e=>'KES '+e.toLocaleString();
            const chartData=JSON.stringify({months:Object.keys(revByMonth).sort(),monthRev:Object.keys(revByMonth).sort().map(m=>revByMonth[m]),countries:Object.keys(revByCountry).sort((a,b)=>revByCountry[b]-revByCountry[a]),countryRev:Object.keys(revByCountry).sort((a,b)=>revByCountry[b]-revByCountry[a]).map(c=>revByCountry[c]),methods:Object.keys(revByMethod),methodRev:Object.keys(revByMethod).map(m=>revByMethod[m]),distPaid:dist.paid,distPending:dist.pending,distCancelled:dist.cancelled,distRefunded:dist.refunded});
            const unread=getUnreadCount();
            const methodNames={mpesa:'M-Pesa',paypal:'PayPal',stripe:'Stripe',bank_wire:'Bank Wire',crypto_usdt:'USDT',crypto_btc:'BTC',crypto_eth:'ETH',crypto_usdc:'USDC',crypto_sol:'SOL',binance_pay:'Binance',wise:'Wise',flutterwave:'Flutterwave'};
            const pgx = pgSlice('afinance', allTxns);
            return `
          <div class="dash-shell">
            <div class="dash-side">
              <div class="side-title">Admin Console</div>
              <a class="side-link" data-nav="admin-dashboard"><i class="fa-solid fa-gauge"></i> Applications</a>
              <a class="side-link" data-nav="admin-jobs"><i class="fa-solid fa-briefcase"></i> Manage Jobs</a>
              <a class="side-link" data-nav="admin-fees"><i class="fa-solid fa-coins"></i> Fee Structure</a>
              <a class="side-link active"><i class="fa-solid fa-chart-line"></i> Finance</a>
              <a class="side-link" data-nav="messages"><i class="fa-solid fa-comment-dots"></i> Messages${unread?' <span class="msg-count">'+unread+'</span>':''}</a>
              <div class="side-title" style="margin-top:20px">Account</div>
              <a class="side-link" data-action="logout"><i class="fa-solid fa-right-from-bracket"></i> Log Out</a>
            </div>
            <div class="dash-main">
              <div class="dash-topbar finance-topbar">
                <h2><i class="fa-solid fa-chart-line" style="color:var(--maroon-500)"></i> Finance Dashboard</h2>
                <div style="display:flex;gap:8px;flex-wrap:wrap">
                  <button class="btn btn-outline btn-sm" id="financeRefreshBtn"><i class="fa-solid fa-rotate"></i> Refresh</button>
                  <button class="btn btn-outline btn-sm" id="financeExportBtn"><i class="fa-solid fa-download"></i> Export CSV</button>
                </div>
              </div>
              <div class="stat-grid stat-grid-6">
                <div class="stat-card"><div class="n" style="color:var(--blue-900)">${fmKES(totalDue)}</div><div class="l"><i class="fa-solid fa-receipt"></i> Total Due</div></div>
                <div class="stat-card"><div class="n" style="color:var(--emerald-600)">${fmKES(totalPaid)}</div><div class="l"><i class="fa-solid fa-circle-check"></i> Collected</div></div>
                <div class="stat-card"><div class="n" style="color:var(--amber-600)">${fmKES(totalPending)}</div><div class="l"><i class="fa-solid fa-clock"></i> Pending</div></div>
                <div class="stat-card"><div class="n" style="color:var(--rose-600)">${fmKES(totalCancelled)}</div><div class="l"><i class="fa-solid fa-ban"></i> Cancelled</div></div>
                <div class="stat-card"><div class="n" style="color:var(--slate-500)">${fmKES(totalRefunded)}</div><div class="l"><i class="fa-solid fa-rotate-left"></i> Refunded</div></div>
                <div class="stat-card"><div class="n" style="color:var(--blue-900)">${txnCount}</div><div class="l"><i class="fa-solid fa-list"></i> Transactions</div></div>
              </div>
              <div class="chart-grid-2">
                <div class="stat-card" style="padding:14px"><div style="font-size:12px;font-weight:700;color:var(--blue-900);margin-bottom:8px"><i class="fa-solid fa-chart-line" style="color:var(--blue-600)"></i> Revenue Over Time</div><canvas id="revChart"></canvas></div>
                <div class="stat-card" style="padding:14px"><div style="font-size:12px;font-weight:700;color:var(--blue-900);margin-bottom:8px"><i class="fa-solid fa-earth-americas" style="color:var(--green-600)"></i> Revenue by Country</div><canvas id="countryChart"></canvas></div>
                <div class="stat-card" style="padding:14px"><div style="font-size:12px;font-weight:700;color:var(--blue-900);margin-bottom:8px"><i class="fa-solid fa-credit-card" style="color:var(--amber-600)"></i> Revenue by Method</div><canvas id="methodChart"></canvas></div>
                <div class="stat-card" style="padding:14px"><div style="font-size:12px;font-weight:700;color:var(--blue-900);margin-bottom:8px"><i class="fa-solid fa-chart-pie" style="color:var(--maroon-500)"></i> Payment Status</div><canvas id="statusChart"></canvas></div>
              </div>
              <div class="client-grid-4">
                <div class="stat-card" style="text-align:center;padding:12px"><div class="n" style="font-size:20px;color:var(--emerald-600)">${activeClients}</div><div class="l"><i class="fa-solid fa-user-check"></i> Active Clients</div></div>
                <div class="stat-card" style="text-align:center;padding:12px"><div class="n" style="font-size:20px;color:var(--amber-600)">${archivedClients}</div><div class="l"><i class="fa-solid fa-box-archive"></i> Archived</div></div>
                <div class="stat-card" style="text-align:center;padding:12px"><div class="n" style="font-size:20px;color:var(--rose-600)">${blockedClients}</div><div class="l"><i class="fa-solid fa-ban"></i> Blocked</div></div>
                <div class="stat-card" style="text-align:center;padding:12px"><div class="n" style="font-size:20px;color:var(--slate-500)">${allTxns.filter(t=>!t.clientName).length}</div><div class="l"><i class="fa-solid fa-trash"></i> Removed</div></div>
              </div>
              <div class="filter-row-flex" style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:16px;align-items:center">
                <select id="financeCountryFilter" style="padding:8px 12px;border:1.5px solid var(--slate-200);border-radius:8px;font-size:12.5px;background:#fff">
                  <option value="All">All Countries</option>
                  ${[...new Set(allTxns.map(t=>t.country).filter(Boolean))].sort().map(c => `<option value="${c}">${c}</option>`).join('')}
                </select>
                <select id="financeStatusFilter" style="padding:8px 12px;border:1.5px solid var(--slate-200);border-radius:8px;font-size:12.5px;background:#fff">
                  <option value="All">All Status</option>
                  <option value="paid">Paid</option><option value="pending">Pending</option><option value="cancelled">Cancelled</option><option value="refunded">Refunded</option>
                </select>
                <select id="financeMethodFilter" style="padding:8px 12px;border:1.5px solid var(--slate-200);border-radius:8px;font-size:12.5px;background:#fff">
                  <option value="All">All Methods</option>
                  ${Object.keys(methodNames).map(k => `<option value="${k}">${methodNames[k]}</option>`).join('')}
                </select>
                <div class="search-input" style="flex:1;min-width:200px;max-width:300px">
                  <i class="fa-solid fa-search"></i>
                  <input type="text" id="financeSearch" placeholder="Search client or transaction..." style="padding-left:34px;width:100%">
                </div>
              </div>
              <div class="stat-card" style="padding:0;overflow:hidden">
                <div class="table-wrap">
                  <table class="finance-table">
                    <thead><tr><th class="rnum">#</th><th>Client</th><th>Service/Fee</th><th>Country</th><th>Amount (KES)</th><th>Method</th><th>Status</th><th>Date</th><th class="rnum">#</th></tr></thead>
                    <tbody id="financeTxnBody">
                      ${allTxns.length ? pgx.items.map((t,ti) => {
                        const bc=t.status==='paid'?'badge-emerald':t.status==='pending'?'badge-amber':t.status==='cancelled'?'badge-rose':'badge-slate';
                        const ci=t.clientStatus==='archived'?' <i class="fa-solid fa-box-archive" title="Archived" style="color:var(--amber-500);font-size:11px"></i>':t.clientStatus==='blocked'?' <i class="fa-solid fa-ban" title="Blocked" style="color:var(--rose-500);font-size:11px"></i>':'';
                        return `<tr><td class="rnum">${pgx.start+ti+1}</td><td><div style="font-weight:600;font-size:13px">${t.clientName}${ci}</div></td><td style="font-size:12px">${t.label}</td><td>${t.country||'—'}</td><td style="font-weight:700;font-family:monospace">${fmKES(t.amountKES)}</td><td><span class="badge ${bc}" style="font-size:10px">${methodNames[t.paymentMethod]||t.paymentMethod}</span></td><td><span class="badge ${bc}">${t.status}</span></td><td style="font-size:12px;color:var(--slate-500)">${t.paidDate?new Date(t.paidDate).toLocaleDateString():'—'}</td><td class="rnum">${pgx.start+ti+1}</td></tr>`;
                      }).join('') : `<tr><td colspan="9"><div class="empty-state"><i class="fa-solid fa-inbox"></i><p>No transactions yet.</p></div></td></tr>`}
                    </tbody>
                  </table>
                </div>
                ${pgBar('afinance', pgx)}
              </div>
              <div class="finance-summary" style="display:flex;justify-content:space-between;align-items:center;margin-top:12px;padding:12px 16px;background:var(--slate-50);border-radius:8px;font-size:13px">
                <span><strong>${txnCount}</strong> transactions</span>
                <span><strong style="color:var(--emerald-600)">${fmKES(totalPaid)}</strong> collected · <strong style="color:var(--amber-600)">${fmKES(totalPending)}</strong> pending</span>
                <span>1 EUR=${EUR_TO_KES} KES · 1 USD=${USD_TO_KES} KES</span>
              </div>
            </div>
          </div>
          <div id="financeChartData" style="display:none">${chartData}</div>`;
        }

        function wireAdminFinance() {
            try {
                const apps=allApps.filter(a=>!a.deleted);
                let txns=[];
                apps.forEach(a=>{
                    try{(a.fees||[]).forEach(f=>{const p=parseAmountKES(f.amount);if(p.kes>0)txns.push({amountKES:p.kes,paid:!!f.paid,paidDate:f.paidDate||null,paymentMethod:f.paymentMethod||'mpesa',status:f.paid?'paid':(f.status||'pending'),country:a.country||'',label:f.label||'Fee',clientName:a.fullName||''})})}catch(e){}
                    try{(a.clientServices||[]).forEach(s=>{const p=parseAmountKES(s.amount);if(p.kes>0)txns.push({amountKES:p.kes,paid:!!s.paid,paidDate:s.paidDate||null,paymentMethod:s.paymentMethod||'mpesa',status:s.paid?'paid':(s.status||'pending'),country:a.country||'',label:s.label||'Service',clientName:a.fullName||''})})}catch(e){}
                });
                const revByMonth={},revByCountry={},revByMethod={},dist={paid:0,pending:0,cancelled:0,refunded:0};
                txns.forEach(t=>{
                    const a=t.amountKES;
                    if(t.status==='paid')dist.paid+=a;else if(t.status==='cancelled')dist.cancelled+=a;else if(t.status==='refunded')dist.refunded+=a;else dist.pending+=a;
                    if(t.paid&&t.paidDate&&a>0){
                        const d=new Date(t.paidDate);
                        if(!isNaN(d)){const k=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0');revByMonth[k]=(revByMonth[k]||0)+a}
                        if(t.country){revByCountry[t.country]=(revByCountry[t.country]||0)+a}
                        if(t.paymentMethod){revByMethod[t.paymentMethod]=(revByMethod[t.paymentMethod]||0)+a}
                    }
                });
                const sortedMonths=Object.keys(revByMonth).sort();
                const sortedCountries=Object.keys(revByCountry).sort((a,b)=>revByCountry[b]-revByCountry[a]);
                // Destroy old charts safely
                if(window.financeCharts){window.financeCharts.forEach(c=>{try{if(c&&typeof c.destroy==='function')c.destroy()}catch(e){}})}
                window.financeCharts=[];
                if(typeof Chart==='undefined')return;
                const isMobile=window.innerWidth<768;
                const baseOpts={responsive:true,maintainAspectRatio:true,aspectRatio:isMobile?1.4:1.8,animation:isMobile?false:{duration:600},resize:{delay:200},plugins:{legend:{position:'bottom',labels:{boxWidth:12,padding:8,font:{size:10}}}}};
                const kesTick={y:{beginAtZero:true,ticks:{callback:v=>'KES '+Math.round(v).toLocaleString()}}};
                // Revenue over time
                const rC=document.getElementById('revChart');
                if(rC&&sortedMonths.length){
                    try{const c=new Chart(rC,{type:'line',data:{labels:sortedMonths,datasets:[{label:'Revenue (KES)',data:sortedMonths.map(m=>revByMonth[m]),borderColor:'#059669',backgroundColor:'rgba(5,150,105,0.1)',fill:true,tension:0.3,pointRadius:isMobile?2:3}]},options:{...baseOpts,scales:kesTick}});window.financeCharts.push(c)}catch(e){}
                }
                // Revenue by country
                const cC=document.getElementById('countryChart');
                if(cC&&sortedCountries.length){
                    try{const colors=['#3B82F6','#10B981','#F59E0B','#EF4444','#8B5CF6','#EC4899','#14B8A6','#F97316'];
                    const c=new Chart(cC,{type:'bar',data:{labels:sortedCountries,datasets:[{label:'Revenue (KES)',data:sortedCountries.map(c=>revByCountry[c]),backgroundColor:sortedCountries.map((_,i)=>colors[i%colors.length])}]},options:{...baseOpts,indexAxis:'y',scales:{x:{beginAtZero:true,ticks:{callback:v=>'KES '+Math.round(v).toLocaleString()}},y:{ticks:{font:{size:9}}}}}});window.financeCharts.push(c)}catch(e){}
                }
                // Revenue by method
                const mC=document.getElementById('methodChart');
                if(mC&&Object.keys(revByMethod).length){
                    try{const mc={mpesa:'#4CAF50',paypal:'#003087',stripe:'#635BFF',crypto_usdt:'#26A17B',crypto_btc:'#F7931A',crypto_eth:'#627EEA',crypto_usdc:'#2775CA',crypto_sol:'#9945FF',binance_pay:'#F0B90B',bank_wire:'#1E293B',wise:'#00B9FF',flutterwave:'#F09A0B'};
                    const mn={mpesa:'M-Pesa',paypal:'PayPal',stripe:'Stripe',crypto_usdt:'USDT',crypto_btc:'BTC',crypto_eth:'ETH',crypto_usdc:'USDC',crypto_sol:'SOL',binance_pay:'Binance',bank_wire:'Bank Wire',wise:'Wise',flutterwave:'Flutterwave'};
                    const methods=Object.keys(revByMethod);
                    const c=new Chart(mC,{type:'doughnut',data:{labels:methods.map(m=>mn[m]||m),datasets:[{data:methods.map(m=>revByMethod[m]),backgroundColor:methods.map(m=>mc[m]||'#94A3B8')}]},options:{responsive:true,maintainAspectRatio:true,aspectRatio:isMobile?1:1.2,animation:isMobile?false:{duration:600},resize:{delay:200},plugins:{legend:{position:'bottom',labels:{boxWidth:12,padding:8,font:{size:9}}}}}});window.financeCharts.push(c)}catch(e){}
                }
                // Status distribution
                const sC=document.getElementById('statusChart');
                if(sC){
                    try{const c=new Chart(sC,{type:'pie',data:{labels:['Paid','Pending','Cancelled','Refunded'],datasets:[{data:[dist.paid,dist.pending,dist.cancelled,dist.refunded],backgroundColor:['#10B981','#F59E0B','#EF4444','#94A3B8']}]},options:{responsive:true,maintainAspectRatio:true,aspectRatio:isMobile?1:1.2,animation:isMobile?false:{duration:600},resize:{delay:200},plugins:{legend:{position:'bottom',labels:{boxWidth:12,padding:8,font:{size:10}}}}}});window.financeCharts.push(c)}catch(e){}
                }
                // Filters
                const savedFilters=window._ff;
                ['financeCountryFilter','financeStatusFilter','financeMethodFilter'].forEach(id=>{
                    const e=document.getElementById(id);
                    if(e){
                        if(savedFilters&&savedFilters[id.replace('finance','').replace('Filter','').toLowerCase()]&&savedFilters[id.replace('finance','').replace('Filter','').toLowerCase()]!=='All')
                            e.value=savedFilters[id.replace('finance','').replace('Filter','').toLowerCase()];
                        e.addEventListener('change',()=>{saveFinanceFilters();refilterFinanceTable()});
                    }
                });
                const se=document.getElementById('financeSearch');
                if(se){if(savedFilters&&savedFilters.search)se.value=savedFilters.search;let st;se.addEventListener('input',()=>{clearTimeout(st);st=setTimeout(()=>{saveFinanceFilters();refilterFinanceTable()},400)})}
                const rf=document.getElementById('financeRefreshBtn');
                if(rf)rf.addEventListener('click',()=>{try{saveFinanceFilters();renderCurrentView();toast('Finance data refreshed.','ok')}catch(e){toast('Refresh failed: '+e.message,'err')}});
                const ex=document.getElementById('financeExportBtn');
                if(ex)ex.addEventListener('click',()=>{try{exportFinanceCSV()}catch(e){toast('Export failed.','err')}});
                // Apply saved filters
                if(savedFilters)refilterFinanceTable();
            } catch(e) { console.error('wireAdminFinance error:', e); }
        }

        function saveFinanceFilters(){
            const g=id=>{const e=document.getElementById(id);return e?e.value:'All'};
            window._ff={country:g('financeCountryFilter'),status:g('financeStatusFilter'),method:g('financeMethodFilter'),search:g('financeSearch')};
        }

        function refilterFinanceTable(){
            const f=window._ff||{country:'All',status:'All',method:'All',search:''};
            const body=document.getElementById('financeTxnBody');
            if(!body)return;
            body.querySelectorAll('tr').forEach(row=>{
                let show=true;
                const c=row.children;
                if(f.country!=='All'&&c[3]&&!c[3].textContent.includes(f.country))show=false;
                if(f.status!=='All'&&c[6]&&!c[6].textContent.toLowerCase().includes(f.status))show=false;
                if(f.method!=='All'&&c[5]&&!c[5].textContent.toLowerCase().includes(f.method))show=false;
                if(f.search){const txt=row.textContent.toLowerCase();if(!txt.includes(f.search.toLowerCase()))show=false}
                row.style.display=show?'':'none';
            });
        }

        function exportFinanceCSV(){
            const rows=[['Client','Service/Fee','Country','Amount (KES)','Method','Status','Date']];
            const body=document.getElementById('financeTxnBody');
            if(body){
            body.querySelectorAll('tr').forEach(tr=>{
                const c=tr.querySelectorAll('td');
                if(c.length>=8)rows.push([c[1].textContent.trim(),c[2].textContent.trim(),c[3].textContent.trim(),c[4].textContent.trim(),c[5].textContent.trim(),c[6].textContent.trim(),c[7].textContent.trim()]);
            });
            }
            const csv=rows.map(r=>r.map(c=>'"'+c.replace(/"/g,'""')+'"').join(',')).join('\n');
            const blob=new Blob([csv],{type:'text/csv'});
            const url=URL.createObjectURL(blob);
            const a=document.createElement('a');a.href=url;a.download='finance_'+new Date().toISOString().slice(0,10)+'.csv';
            a.click();URL.revokeObjectURL(url);
            toast('CSV exported.','ok');
        }

        // =============================================================
        // MESSAGING VIEWS (WhatsApp-like multi-device chat)
        // =============================================================
        function viewMessages() {
            if (!currentUser || !currentUserData) {
                return `<div class="section"><div class="wrap"><div class="empty-state"><i class="fa-solid fa-lock"></i><p>Please log in to view messages.</p><a class="btn btn-primary" data-nav="login">Log In</a></div></div></div>`;
            }
            if (unsubscribeMessages) { unsubscribeMessages(); unsubscribeMessages = null; }
            olderMessages = []; msgEarliestTimestamp = null; msgHasMore = false;
            const chats = allChats;
            const isAdmin = currentUserData.type === 'admin';
            return `
          <div class="msg-shell">
            <div class="msg-list-panel show">
              <div class="msg-list-header">
                <i class="fa-solid fa-comment-dots" style="color:var(--maroon-500)"></i> Messages
                <span style="font-size:12px;color:var(--slate-500);font-weight:400;margin-left:8px">${chats.length} conversation${chats.length !== 1 ? 's' : ''}</span>
              </div>
              <input class="msg-search" id="msgSearchInput" type="text" placeholder="Search conversations..." autocomplete="off">
              <div id="msgListWrap">${chats.length ? chats.map(c => {
                const unread = c.unread?.[currentUser.uid] || 0;
                const isActive = ROUTE.params.chatId === c.id;
                return `
                  <div class="msg-list-item ${isActive ? 'active' : ''}" data-chatid="${c.id}" data-chatname="${esc(c.otherName)}" data-search="${esc((c.otherName||'')+' '+(c.lastMessage||'')).toLowerCase()}">
                    <div class="msg-avatar">${esc(c.otherName?.charAt(0)?.toUpperCase() || '?')}</div>
                    <div class="msg-list-content">
                      <div class="msg-list-name">${esc(c.otherName)}</div>
                      <div class="msg-list-preview">${esc(c.lastMessage || 'No messages yet')}</div>
                    </div>
                    <div class="msg-list-meta">
                      ${unread ? `<span class="msg-unread">${unread}</span>` : ''}
                      <div class="msg-list-time">${c.lastTimestamp ? fmtDateShort(c.lastTimestamp) : ''}</div>
                    </div>
                    ${isAdmin?`<button class="chat-del" data-delchat="${c.id}" data-chatname="${esc(c.otherName)}" title="Delete conversation"><i class="fa-solid fa-trash-can"></i></button>`:''}
                  </div>`;
              }).join("") : `
                <div class="msg-empty" style="flex-direction:column;padding:40px 20px">
                  <i class="fa-solid fa-comment-slash"></i>
                  <p style="font-size:14px;color:var(--slate-500);margin-top:10px">No conversations yet.</p>
                  <p style="font-size:12px;color:var(--slate-400);margin-top:4px">When an admin contacts you, it will appear here.</p>
                  ${currentUserData?.type === 'applicant' ? `<button class="btn btn-primary btn-sm" style="margin-top:16px" data-action="contact-support"><i class="fa-solid fa-headset"></i> Contact Support</button>` : ''}
                </div>`}</div>
            </div>
            <div class="msg-chat-panel show">
              <div class="msg-empty" style="flex-direction:column">
                <i class="fa-solid fa-comment-dots"></i>
                <p style="font-size:14px;color:var(--slate-500);margin-top:10px">Select a conversation to start chatting</p>
                <p style="font-size:12px;color:var(--slate-400);margin-top:4px">Real-time messaging across all your devices</p>
              </div>
            </div>
          </div>`;
        }

        async function startChatWithAdmin() {
            try {
                const chat = await getOrCreateChat();
                if (chat) navigate("messages-chat", { chatId: chat.id, otherName: "Admin" });
            } catch (e) {
                console.error("Start chat error:", e);
                toast("Could not start chat. Check your connection.", "err");
            }
        }

        function wireMessages() {
            document.querySelectorAll('[data-action="contact-support"]').forEach(el => el.addEventListener('click', startChatWithAdmin));
            document.querySelectorAll('[data-chatid]').forEach(el => {
                el.addEventListener('click', (e) => {
                    if(e.target.closest('.chat-del'))return;
                    const chatId = el.getAttribute('data-chatid');
                    const otherName = el.getAttribute('data-chatname') || "Chat";
                    navigate("messages-chat", { chatId, otherName });
                });
            });
            document.querySelectorAll('.chat-del').forEach(b=>b.addEventListener('click',async function(e){
                e.stopPropagation();
                const id=this.getAttribute('data-delchat');
                const name=this.getAttribute('data-chatname')||"Chat";
                if(id)await deleteChatForever(id,name);
            }));
            const searchInput=document.getElementById('msgSearchInput');
            if(searchInput)searchInput.addEventListener('input',function(){
                const q=this.value.toLowerCase().trim();
                document.querySelectorAll('#msgListWrap .msg-list-item').forEach(el=>{
                    const hay=el.getAttribute('data-search')||'';
                    el.style.display=q&&!hay.includes(q)?'none':'flex';
                });
            });
        }

        function viewMessagesChat() {
            if (!currentUser || !currentUserData) {
                return `<div class="section"><div class="wrap"><div class="empty-state"><i class="fa-solid fa-lock"></i><p>Please log in to view messages.</p></div></div></div>`;
            }
            const chatId = ROUTE.params.chatId;
            const otherName = ROUTE.params.otherName || "User";
            const chats = allChats;
            const isMobile = window.innerWidth <= 820;
            const isAdmin = currentUserData.type === 'admin';
            return `
          <div class="msg-shell">
            <div class="msg-list-panel ${isMobile ? '' : 'show'}">
              <div class="msg-list-header">
                <i class="fa-solid fa-comment-dots" style="color:var(--maroon-500)"></i> Messages
              </div>
              <input class="msg-search" id="msgSearchInput" type="text" placeholder="Search conversations..." autocomplete="off">
              <div id="msgListWrap">${chats.length ? chats.map(c => {
                const unread = c.unread?.[currentUser.uid] || 0;
                const isActive = c.id === chatId;
                return `
                  <div class="msg-list-item ${isActive ? 'active' : ''}" data-chatid="${c.id}" data-chatname="${esc(c.otherName)}" data-search="${esc((c.otherName||'')+' '+(c.lastMessage||'')).toLowerCase()}">
                    <div class="msg-avatar">${esc(c.otherName?.charAt(0)?.toUpperCase() || '?')}</div>
                    <div class="msg-list-content">
                      <div class="msg-list-name">${esc(c.otherName)}</div>
                      <div class="msg-list-preview">${esc(c.lastMessage || 'No messages yet')}</div>
                    </div>
                    <div class="msg-list-meta">
                      ${unread ? `<span class="msg-unread">${unread}</span>` : ''}
                      <div class="msg-list-time">${c.lastTimestamp ? fmtDateShort(c.lastTimestamp) : ''}</div>
                    </div>
                    ${isAdmin?`<button class="chat-del" data-delchat="${c.id}" data-chatname="${esc(c.otherName)}" title="Delete conversation"><i class="fa-solid fa-trash-can"></i></button>`:''}
                  </div>`;
              }).join("") : `<div class="msg-empty" style="flex-direction:column;padding:40px 20px"><i class="fa-solid fa-comment-slash"></i></div>`}</div>
            </div>
            <div class="msg-chat-panel show" id="chatPanel">
              <div class="msg-chat-header">
                <button class="btn btn-outline btn-sm" id="msgBackBtn" style="display:none"><i class="fa-solid fa-arrow-left"></i></button>
                <div class="msg-avatar" style="width:36px;height:36px;font-size:14px;cursor:pointer" title="Click for contact details">${esc(otherName?.charAt(0)?.toUpperCase() || '?')}</div>
                <div style="flex:1;min-width:0">
                  <div style="font-size:14px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(otherName)}</div>
                  <div style="font-size:11px;color:var(--slate-400);font-weight:400" id="chatStatusText"></div>
                </div>
                ${isAdmin?`<button class="chat-header-del" id="chatHeaderDelBtn" title="Delete conversation"><i class="fa-solid fa-trash-can"></i></button>`:''}
              </div>
          <div class="msg-chat-body" id="msgChatBody">
            <div class="msg-empty" style="flex-direction:column;padding:20px">
              <i class="fa-solid fa-comment-dots"></i>
              <p style="font-size:13px;color:var(--slate-500);margin-top:8px">No messages yet</p>
            </div>
          </div>
              <div class="msg-chat-input">
                <textarea id="msgInput" placeholder="Type a message..." rows="1"></textarea>
                <button class="btn-send" id="msgSendBtn"><i class="fa-solid fa-paper-plane"></i></button>
                <button class="btn-file" id="msgFileBtn"><i class="fa-solid fa-paperclip"></i></button>
              </div>
            </div>
          </div>`;
        }

        let currentChatMessages = [];

    function renderMessagesChat(chatId, messages) {
        const body = document.getElementById('msgChatBody');
        if (!body) return;
        currentChatMessages = messages || [];
        const uid = currentUser.uid;
        if (!messages || messages.length === 0) {
            body.innerHTML = `<div class="msg-empty" style="flex-direction:column;padding:40px 20px">
              <i class="fa-solid fa-comment-dots"></i>
              <p style="font-size:14px;color:var(--slate-500);margin-top:10px">No messages yet</p>
              <p style="font-size:12px;color:var(--slate-400);margin-top:4px">Send a message to start the conversation</p>
            </div>`;
            return;
        }
        const loadOlder = msgHasMore ? `<div class="load-older-wrap" style="text-align:center;padding:10px 0"><button class="btn btn-outline btn-sm" id="loadOlderBtn"><i class="fa-solid fa-chevron-up"></i> Load older messages</button></div>` : '';
        body.innerHTML = loadOlder + messages.map((m, idx) => {
            const isSent = (m.senderId || m.sender) === uid;
            const senderDisplay = m.senderName || (isSent ? 'You' : (ROUTE.params.otherName || 'User'));
            const time = m.timestamp ? fmtMsgTime(m.timestamp) : '';
            const fileHtml = m.fileUrl ? `<div class="msg-file"><i class="fa-solid fa-paperclip"></i><a href="${m.fileUrl}" target="_blank">${esc(m.fileName || 'View File')}</a></div>` : '';
            const prevMsg = idx > 0 ? messages[idx - 1] : null;
            const showDate = shouldShowDateSeparator(m, prevMsg);
            const dateSep = showDate ? `<div class="msg-date-sep"><span>${formatMsgDate(m.timestamp)}</span></div>` : '';
            return `${dateSep}<div class="msg-bubble ${isSent ? 'sent' : 'rec'} msg-anim">${isSent?'':`<div class="msg-sender-name">${esc(senderDisplay)}</div>`}<div>${esc(m.text)}</div>
              ${fileHtml}
              <div class="msg-time">${time}${isSent?' <span class="msg-read-check"><i class="fa-solid fa-check"></i><i class="fa-solid fa-check" style="margin-left:-6px"></i></span>':''}</div>
            </div>`;
        }).join("");
        const loadBtn = document.getElementById('loadOlderBtn');
        if (loadBtn) loadBtn.addEventListener('click', () => loadOlderMessages(chatId));
        body.scrollTop = body.scrollHeight;
    }

function wireMessagesChat() {
    const chatId = ROUTE.params.chatId;
    const otherName = ROUTE.params.otherName || "User";
    if (!chatId) { toast("Chat not found.", "err"); navigate("messages"); return; }

    const isMobile = window.innerWidth <= 820;
    const backBtn = document.getElementById('msgBackBtn');
    if (backBtn && isMobile) backBtn.style.display = 'inline-flex';
    if (backBtn) backBtn.addEventListener('click', () => navigate("messages"));

    const chatStatus = document.getElementById('chatStatusText');
    if (chatStatus) chatStatus.textContent = 'Online';

    document.querySelectorAll('[data-chatid]').forEach(el => {
        el.addEventListener('click', (e) => {
            if(e.target.closest('.chat-del'))return;
            const cid = el.getAttribute('data-chatid');
            const oname = el.getAttribute('data-chatname') || "Chat";
            navigate("messages-chat", { chatId: cid, otherName: oname });
        });
    });

    document.querySelectorAll('.chat-del').forEach(b=>b.addEventListener('click',async function(e){
        e.stopPropagation();
        const id=this.getAttribute('data-delchat');
        const name=this.getAttribute('data-chatname')||"Chat";
        if(id)await deleteChatForever(id,name);
    }));

    const searchInput=document.getElementById('msgSearchInput');
    if(searchInput)searchInput.addEventListener('input',function(){
        const q=this.value.toLowerCase().trim();
        document.querySelectorAll('#msgListWrap .msg-list-item').forEach(el=>{
            const hay=el.getAttribute('data-search')||'';
            el.style.display=q&&!hay.includes(q)?'none':'flex';
        });
    });

    subscribeMessages(chatId);

    const input = document.getElementById('msgInput');
    const sendBtn = document.getElementById('msgSendBtn');
    const fileBtn = document.getElementById('msgFileBtn');

    // Keyboard-aware viewport handler — keeps input bar above keyboard (WhatsApp style)
    const panel = document.getElementById('chatPanel');
    if (window.visualViewport && panel) {
        const navEl = document.querySelector('.nav-inner');
        const getNavHeight = () => navEl ? navEl.offsetHeight : 72;
        function onViewportChange() {
            const vv = window.visualViewport;
            const navH = getNavHeight();
            panel.style.height = (vv.height - navH) + 'px';
            const body = document.getElementById('msgChatBody');
            if (body) setTimeout(() => body.scrollTop = body.scrollHeight, 80);
        }
        window.visualViewport.addEventListener('resize', onViewportChange);
        window.visualViewport.addEventListener('scroll', onViewportChange);
        viewportCleanup = () => {
            window.visualViewport.removeEventListener('resize', onViewportChange);
            window.visualViewport.removeEventListener('scroll', onViewportChange);
            panel.style.height = '';
        };
    }

    // Scroll to bottom when input is focused (keyboard coming up)
    if (input) {
        input.addEventListener('focus', () => {
            setTimeout(() => {
                const body = document.getElementById('msgChatBody');
                if (body) body.scrollTop = body.scrollHeight;
            }, 350);
        });
    }

    async function doSend() {
        const text = input.value.trim();
        if (text && !sendBtn.disabled) {
            sendBtn.disabled = true; sendBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
            try {
                await sendMessage(chatId, text, '', '');
                input.value = ''; input.style.height = 'auto';
                input.focus();
            } finally {
                sendBtn.disabled = false; sendBtn.innerHTML = '<i class="fa-solid fa-paper-plane"></i>';
            }
        }
    }

    sendBtn.addEventListener('click', doSend);
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            doSend();
        }
    });
    input.addEventListener('input', () => {
        input.style.height = 'auto';
        input.style.height = Math.min(input.scrollHeight, 120) + 'px';
    });

    fileBtn.addEventListener('click', () => {
        const dialog = uploadcare.openDialog(null, {
            publicKey: UPLOADCARE_PUBLIC_KEY, multiple: false, imgOnly: false
        });
        dialog.done((file) => {
            file.promise().then((info) => { validateFileSize(10)(info)
                sendMessage(chatId, '', info.cdnUrl, info.name || 'File');
                toast('File sent!', 'ok');
            }).catch(() => toast('Upload failed.', 'err'));
        });
        dialog.fail(() => toast('Upload cancelled.', 'err'));
    });

    // Avatar click → show user details
    document.querySelector('.msg-chat-header .msg-avatar')?.addEventListener('click', () => showChatUserDetails(otherName, chatId));
    // Header delete button
    if (currentUserData?.type === 'admin') {
        document.getElementById('chatHeaderDelBtn')?.addEventListener('click', () => deleteChatForever(chatId, otherName));
    }
}

async function deleteChatForever(chatId,chatName) {
    if(!currentUser)return;
    if(currentUserData?.type!=='admin'){toast("Only admins can delete conversations.","err");return;}
    if(!confirm(`Delete conversation with "${esc(chatName||'this user')}"? This will permanently remove the entire chat history for everyone. This cannot be undone.`))return;
    if(!confirm(`⚠️ ARE YOU SURE? This cannot be undone.`))return;
    try{
        await updateDoc(doc(db,"chats",chatId),{deleted:true,deletedAt:serverTimestamp(),deletedBy:currentUser.uid});
        allChats=allChats.filter(c=>c.id!==chatId);
        toast('Conversation deleted.','ok');
        if(ROUTE.view==='messages-chat'&&ROUTE.params.chatId===chatId)navigate("messages");
        else renderCurrentView();
    }catch(e){
        console.error("deleteChatForever error:",e);
        toast('Failed to delete: '+e.message,'err');
    }
}

function showChatUserDetails(userName, chatId) {
    const chat = allChats.find(c => c.id === chatId);
    if (!chat) { toast("Details not available.", "err"); return; }
    const otherUid = chat.otherUid;
    const isApplicant = currentUserData?.type === 'applicant';
    const root = document.getElementById('modal-root');
    // For applicant: show admin info; for admin: show applicant info (from allApps)
    if (isApplicant) {
        root.innerHTML = `
        <div class="modal-overlay" id="modalOverlay">
            <div class="modal" style="max-width:420px">
                <div class="modal-head"><h3>${esc(userName)}</h3><button class="modal-close" id="modalCloseBtn"><i class="fa-solid fa-xmark"></i></button></div>
                <div class="modal-body" style="text-align:center;padding:30px">
                    <div class="msg-avatar" style="width:64px;height:64px;font-size:28px;margin:0 auto 12px">${esc(userName.charAt(0).toUpperCase())}</div>
                    <div style="font-size:16px;font-weight:700;color:var(--blue-900)">${esc(userName)}</div>
                    <div style="font-size:13px;color:var(--slate-500)">Platform Administrator</div>
                </div>
                <div class="modal-foot"><button class="btn btn-outline btn-sm" id="modalCloseBtn2">Close</button></div>
            </div>
        </div>`;
    } else {
        let app = allApps.find(a => a.uid === otherUid);
        if (!app) app = currentUserData;
        root.innerHTML = `
        <div class="modal-overlay" id="modalOverlay">
            <div class="modal" style="max-width:500px">
                <div class="modal-head"><h3>${esc(app?.fullName || userName)}</h3><button class="modal-close" id="modalCloseBtn"><i class="fa-solid fa-xmark"></i></button></div>
                <div class="modal-body">
                    <div style="display:flex;gap:20px;margin-bottom:16px;align-items:center">
                        <div class="msg-avatar" style="width:52px;height:52px;font-size:22px">${esc((app?.fullName || userName).charAt(0).toUpperCase())}</div>
                        <div><div style="font-size:16px;font-weight:700;color:var(--blue-900)">${esc(app?.fullName || userName)}</div><div style="font-size:13px;color:var(--slate-500)">${esc(app?.email || '')}</div></div>
                    </div>
                    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;font-size:13px;line-height:1.8">
                        <div><b>Phone:</b> ${esc(app?.phone || '—')}</div>
                        <div><b>Nationality:</b> ${esc(app?.nationality || '—')}</div>
                        <div><b>Position:</b> ${esc(app?.jobTitle || '—')}</div>
                        <div><b>Country:</b> ${esc(app?.country || '—')}</div>
                        <div>${app?.status ? statusBadge(app.status) : ''}</div>
                        <div><b>Passport:</b> ${esc(app?.passportNumber || '—')}</div>
                    </div>
                </div>
                <div class="modal-foot"><button class="btn btn-outline btn-sm" id="modalCloseBtn2">Close</button></div>
            </div>
        </div>`;
    }
    document.getElementById('modalCloseBtn').addEventListener('click', () => root.innerHTML = '');
    document.getElementById('modalCloseBtn2')?.addEventListener('click', () => root.innerHTML = '');
    document.getElementById('modalOverlay').addEventListener('click', (e) => { if (e.target.id === 'modalOverlay') root.innerHTML = ''; });
}

        function viewFaq() {
            const faqs = [
                ["Does Europe Sponsor Jobs charge job seekers a fee?", "No. In line with ILO Fair Recruitment principles, we do not charge workers placement fees. Any legitimate third-party costs (e.g. government visa fees, medical exams) are disclosed transparently."],
                ["How long does visa sponsorship processing take?", "Typically 4–10 weeks depending on destination country and role, though this can vary based on embassy processing times and document readiness."],
                ["What documents do I need to apply?", "A CV/Resume and passport photo are required to apply. A passport number and details are needed. Additional documents (medical, police clearance) are requested once you reach the relevant stage."],
                ["Can I apply for more than one job?", "Yes — you're welcome to submit separate applications for different roles. Our team will match you to the most suitable opportunity."],
                ["Is accommodation provided?", "Many employer partners provide or subsidise accommodation. This is specified per job listing."],
                ["How do I check my application status?", "Use the 'Check Status' page with your Application ID or email, or log into your applicant portal for full details, document status, and messaging."],
                ["How does the messaging system work?", "Once you have an application, you can chat with our admin team in real-time — like WhatsApp. Messages sync across all your devices automatically."]
            ];
            return `<section class="section" style="padding-top:44px"><div class="wrap legal-body">
            <div class="section-head"><div class="eyebrow"><i class="fa-solid fa-circle-question"></i> FAQ</div><h2>Frequently Asked Questions</h2></div>
            <div>${faqs.map(([q,a]) => `<div class="card pad" style="margin-bottom:14px"><h3 style="margin:0 0 8px;font-size:15px">${q}</h3><p style="margin:0">${a}</p></div>`).join("")}</div>
          </div></section>`;
        }

        function viewTerms() {
            return `<section class="section" style="padding-top:44px"><div class="wrap legal-body">
            <div class="section-head"><div class="eyebrow"><i class="fa-solid fa-scale-balanced"></i> Legal</div><h2>Terms &amp; Conditions</h2><p>Last updated: July 2026</p></div>
            <h3>1. About Europe Sponsor Jobs</h3><p>Europe Sponsor Jobs ("the Agency") facilitates the recruitment and placement of job seekers with verified European employers offering visa sponsorship. Use of this platform constitutes acceptance of these Terms.</p>
            <h3>2. No Placement Fees to Workers</h3><p>The Agency does not charge job seekers for registration, interviews, or placement. Any legitimate government or third-party cost will be clearly disclosed in writing.</p>
            <h3>3. Eligibility &amp; Accuracy</h3><p>Applicants must be of legal working age and must provide accurate, truthful information. Misrepresentation may result in disqualification.</p>
            <h3>4. Selection &amp; Placement</h3><p>Submitting an application does not guarantee an interview, job offer, or visa approval. Final hiring decisions rest with partner employers.</p>
            <h3>5. Data Processing</h3><p>Personal data is processed solely for recruitment purposes, as described in our Privacy Policy.</p>
            <h3>6. Governing Law</h3><p>These Terms are governed by the laws of the jurisdiction in which Europe Sponsor Jobs is registered.</p>
            <h3>7. Contact</h3><p>Questions can be directed to support@europesponsorjobs.com or via the in-app messaging system.</p>
          </div></section>`;
        }

        function viewPrivacy() {
            return `<section class="section" style="padding-top:44px"><div class="wrap legal-body">
            <div class="section-head"><div class="eyebrow"><i class="fa-solid fa-lock"></i> Legal</div><h2>Privacy &amp; Data Protection</h2><p>Last updated: July 2026</p></div>
            <h3>1. Information We Collect</h3><p>Full name, date of birth, nationality, phone number, email address, residential address, education level, work experience, passport number, passport photo (image), CV/resume (PDF), certificates, reference letters, medical reports, contract documents, application status history, messaging/chat communications, and technical data (IP address, browser type, device info via cookies and analytics).</p>
            <h3>2. How We Use It</h3><p>To evaluate your application, match you with employers, process visa sponsorship documentation, communicate with you about your application status, provide real-time messaging support, comply with legal obligations, and improve platform functionality. Uploadcare CDN is used for document delivery; Firebase (Google Cloud) hosts all data.</p>
            <h3>3. Legal Basis (GDPR)</h3><p>We process personal data based on: (a) your explicit consent given at registration/application, (b) performance of a contract (recruitment services), (c) compliance with legal obligations (immigration records), and (d) legitimate interests (fraud prevention, platform security). Special category data (passport copies, medical records) is processed only with your explicit consent (GDPR Art. 9).</p>
            <h3>4. Who We Share It With</h3><p>Relevant details are shared with prospective employers and, where required, government or immigration authorities, solely for recruitment and deployment purposes. Third-party processors: Google Cloud/Firebase (infrastructure), Uploadcare (file CDN). We do not sell personal data to third parties.</p>
            <h3>5. Data Retention</h3><p>Personal data is retained for the duration of your application plus 12 months after the last activity, unless earlier deletion is requested. Chat messages are retained for 24 months. You may request earlier deletion at any time.</p>
            <h3>6. Data Protection Principles</h3><p>We apply data minimisation, purpose limitation, encryption in transit (TLS), access controls, and reasonable security safeguards consistent with international data protection standards, including GDPR for EU-based data flows.</p>
            <h3>7. Your Rights</h3><p>You have the right to: (a) access your personal data — <a href="#" data-nav="applicant-dashboard">log into your portal</a> to view all data; (b) rectification — update your profile information via the portal; (c) erasure ('right to be forgotten') — use the <strong>"Delete My Data"</strong> link in your portal sidebar or email support@europesponsorjobs.com; (d) data portability — request a machine-readable export by emailing support@europesponsorjobs.com; (e) withdraw consent at any time without affecting the lawfulness of processing before withdrawal.</p>
            <h3>8. Cookies &amp; Tracking</h3><p>This platform uses essential cookies for authentication (Firebase Auth) and session management. Uploadcare may set cookies for file upload functionality. We do not use tracking cookies or third-party analytics. You may disable cookies in your browser settings, though this may affect platform functionality.</p>
            <h3>9. International Transfers</h3><p>Your data is stored on Google Cloud servers which may be located outside the European Economic Area (EEA). Appropriate safeguards (Standard Contractual Clauses) are in place to ensure adequate protection per GDPR Art. 46.</p>
            <h3>10. Contact &amp; DPO</h3><p>For all data protection enquiries, including exercising your rights, contact: support@europesponsorjobs.com or via the in-app messaging system. We will respond within 30 days.</p>
          </div></section>`;
        }

        function viewAboutDemo() {
            return `<section class="section" style="padding-top:44px"><div class="wrap legal-body">
            <div class="section-head"><div class="eyebrow"><i class="fa-solid fa-flask"></i> Platform</div><h2>About This Platform</h2></div>
            <p>Europe Sponsor Jobs is built with Firebase and Uploadcare — a fully serverless, real-time recruitment platform.</p>
            <h3>Tech Stack</h3>
            <ul>
              <li><b>Firebase Authentication</b> — Email/password and Google sign-in for applicants; email/password for admins</li>
              <li><b>Firestore</b> — Real-time NoSQL database for applications, jobs, fees, chats, and messages</li>
              <li><b>Uploadcare</b> — Professional file uploads with CDN delivery (CVs, passport photos, chat file attachments)</li>
              <li><b>Real-time Messaging</b> — Multi-device, multi-network chat system (like WhatsApp) for applicant-admin coordination</li>
              <li><b>Pure HTML/CSS/JS</b> — No frameworks, fast and lightweight</li>
            </ul>
            <h3>System Collections (Firestore)</h3>
            <ul>
              <li><b>jobs</b> — Job listings with title, country, category, salary, description</li>
              <li><b>applications</b> — Full applicant profiles with all personal data, documents, status timeline, internal notes</li>
              <li><b>fees</b> — Service fee structure</li>
              <li><b>admins</b> — Admin user registry (keyed by Firebase Auth UID)</li>
              <li><b>chats</b> — Chat conversations with participants, unread counts, last message</li>
              <li><b>messages</b> — Individual messages within chats (real-time synced)</li>
            </ul>
            <h3>Security &amp; Compliance</h3>
            <ul>
              <li>Passwords are hashed and handled entirely by Firebase Auth — never stored or checked in client code</li>
              <li>Admin access is granted via a Firestore "admins" document keyed to a real Firebase Auth UID</li>
              <li>Real-time data synchronization across all devices</li>
              <li>GDPR-ready consent management with full data disclosure</li>
              <li>Chat messages are encrypted in transit via Firebase/Google infrastructure</li>
            </ul>
          </div></section>`;
        }

        // =============================================================
        // BOOT
        // =============================================================
        try {
            await Promise.all([loadJobs(), loadFees(), loadApps(), loadChats()]);
        } catch (e) { console.warn("Initial data load issue:", e.message); }
        subscribeToRealtime();
        subscribeChats();
        // Restore public route (non-auth pages like jobs, fees, faq)
        try {
            const saved = sessionStorage.getItem('lastRoute');
            if (saved) { const r = JSON.parse(saved); if (r.view && !['login','applicant-dashboard','admin-dashboard','admin-jobs','admin-fees','messages','messages-chat','confirmation'].includes(r.view)) { ROUTE = r; } }
        } catch(e) {}
        renderNavbar();
        renderCurrentView();
        setTimeout(autoSeedJobsIfEmpty, 300);

        // Network stability monitor
        let wasOffline = false;
        window.addEventListener('online',()=>{if(wasOffline){toast('Connection restored.','ok');wasOffline=false;}});
        window.addEventListener('offline',()=>{wasOffline=true;toast('Network lost — working offline. Reconnect to sync.','err');});
        console.log("🌍 Europe Sponsor Jobs v2 — Full Feature Release");
        console.log("📊 Firestore collections: jobs, applications, fees, admins, chats, messages");
        console.log("💬 WhatsApp-like messaging system active");
        console.log("📁 Uploadcare public key:", UPLOADCARE_PUBLIC_KEY);

        // =============================================================
        // INTERNATIONAL PAYMENT FLOW
        // =============================================================
        const PAYMENT_METHODS = [
            { id:'mpesa', name:'M-Pesa', icon:'<svg viewBox="0 0 48 48" width="20" height="20" fill-rule="evenodd" clip-rule="evenodd"><path fill="#aed580" d="M31.003,7.001l-0.001-5.5c0-0.828,0.672-1.5,1.5-1.5c0.828,0,1.5,0.672,1.5,1.5v5.5H31.003z"/><path fill="#aed580" d="M14.964,47.999h18.073c0.533,0,0.965-0.432,0.965-0.965V4.964c0-0.533-0.432-0.965-0.965-0.965H14.964c-0.533,0-0.965,0.432-0.965,0.965v42.07C13.999,47.567,14.431,47.999,14.964,47.999z"/><path fill="#fff" d="M17.739,29.001h12.524c0.962,0,1.741-0.78,1.741-1.741V10.743c0-0.962-0.78-1.741-1.741-1.741H17.739c-0.962,0-1.741,0.78-1.741,1.741V27.26C15.997,28.222,16.777,29.001,17.739,29.001z"/><path fill="#9b2310" d="M12.001,22.001c3.643-0.7,5.865-2.448,7-5c1.135,2.552,3.357,4.3,7,5H12.001z"/><path fill="#e60023" d="M12.001,22.001c4.273,0.867,6.476,1,11,1c5.076,0,11.712-1.939,14-6l-9-4C24.039,18.139,21.863,22.001,12.001,22.001z"/></svg>', color:'#4CAF50', desc:'Mobile money — Kenya & East Africa', badge:'MPESA' },
            { id:'paypal', name:'PayPal', icon:'fa-brands fa-paypal', color:'#003087', desc:'Global — Visa, MC, Amex, Discover' },
            { id:'stripe', name:'Stripe', icon:'fa-brands fa-stripe-s', color:'#635BFF', desc:'Global — Cards, Apple Pay, Google Pay' },
            { id:'crypto_usdt', name:'USDT (Crypto)', icon:'fa-brands fa-bitcoin', color:'#26A17B', desc:'Tether — ERC20/TRC20/BEP20' },
            { id:'crypto_btc', name:'Bitcoin', icon:'fa-brands fa-bitcoin', color:'#F7931A', desc:'BTC — Bitcoin Network' },
            { id:'crypto_eth', name:'Ethereum', icon:'fa-brands fa-ethereum', color:'#627EEA', desc:'ETH — ERC20 Network' },
            { id:'crypto_usdc', name:'USDC', icon:'fa-brands fa-bitcoin', color:'#2775CA', desc:'USD Coin — Eth/Sol/Polygon' },
            { id:'crypto_sol', name:'Solana', icon:'fa-brands fa-bitcoin', color:'#9945FF', desc:'SOL — Fast & low fee' },
            { id:'binance_pay', name:'Binance Pay', icon:'fa-brands fa-btc', color:'#F0B90B', desc:'Binance Pay ID / QR' },
            { id:'bank_wire', name:'Bank Wire (SWIFT)', icon:'fa-building-columns', color:'#1E293B', desc:'SWIFT/IBAN — large transfers' },
            { id:'wise', name:'Wise', icon:'fa-money-bill-transfer', color:'#00B9FF', desc:'International bank transfer' },
            { id:'flutterwave', name:'Flutterwave', icon:'fa-globe', color:'#F09A0B', desc:'Cards + Mobile Money Africa' }
        ];
        const CRYPTO_CHAINS = {
            USDT: ['ERC20 (Ethereum)', 'TRC20 (Tron)', 'BEP20 (Binance)', 'Solana', 'Polygon'],
            USDC: ['Ethereum (ERC20)', 'Solana', 'Polygon'],
            BTC: ['Bitcoin Network'],
            ETH: ['Ethereum (ERC20)'],
            SOL: ['Solana']
        };
        let payTarget = null;
        let selectedPayMethod = null;
        let selectedPayChain = null;

        function getPaymentInstructions(methodId) {
            const map = {
                mpesa: `<b>Send to phone number:</b><br><span onclick="navigator.clipboard.writeText('0143350004');this.querySelector('.cp').textContent='Copied!';setTimeout(()=>this.querySelector('.cp').textContent='Copy',2000)" style="display:inline-flex;align-items:center;gap:8px;margin-top:4px;padding:6px 10px;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:6px;font-size:15px;font-weight:700;font-family:monospace;cursor:pointer" title="Click to copy">0143350004 <span class="cp" style="font-size:11px;font-weight:400;color:#059669">Copy</span></span><ol style="margin:6px 0 0 16px;padding:0;font-size:12.5px;line-height:1.8"><li>Go to <b>M-Pesa</b> on your phone</li><li>Select <b>Send Money</b> (or <b>M-Pesa</b>)</li><li>Send to phone number <b>0143350004</b></li><li>Enter the amount shown above</li><li>Enter your PIN and <b>Send</b></li><li>Enter the M-Pesa transaction code below</li></ol>`,
                paypal: 'Send payment to <b>payments@europesponsor.com</b> via PayPal. Enter the PayPal transaction ID below.',
                stripe: 'Admin will send a secure payment link to your email. Enter the reference code below once completed.',
                crypto_usdt: 'Send <b>USDT</b> to the wallet address provided by admin via WhatsApp. Select your network below and enter the TXID/hash.',
                crypto_btc: 'Send <b>Bitcoin</b> to the wallet address provided by admin via WhatsApp. Enter the TXID/hash below.',
                crypto_eth: 'Send <b>Ethereum</b> to the wallet address provided by admin via WhatsApp. Enter the TXID/hash below.',
                crypto_usdc: 'Send <b>USDC</b> to the wallet address provided by admin via WhatsApp. Select your network below and enter the TXID/hash.',
                crypto_sol: 'Send <b>Solana</b> to the wallet address provided by admin via WhatsApp. Enter the TXID/hash below.',
                binance_pay: 'Send payment via <b>Binance Pay ID</b>. Admin will provide the Pay ID. Enter the reference below.',
                bank_wire: 'Send via <b>SWIFT/IBAN</b> bank transfer. Admin will provide bank details via WhatsApp. Enter the wire reference below.',
                wise: 'Send via <b>Wise</b> to the email provided by admin. Enter the transfer reference below.',
                flutterwave: 'Admin will send a Flutterwave payment link. Enter the reference code below once completed.'
            };
            return map[methodId] || 'Follow the instructions provided by admin. Enter your reference code below.';
        }

        function selectPaymentMethod(methodId) {
            selectedPayMethod = methodId;
            selectedPayChain = null;
            const pm = PAYMENT_METHODS.find(p => p.id === methodId);
            const grid = document.getElementById('payMethodGrid');
            const selDiv = document.getElementById('payMethodSelected');
            grid.style.display = 'none';
            selDiv.style.display = 'flex';
            selDiv.innerHTML = (pm.icon.startsWith('<')?pm.icon:`<i class="${pm.icon}" style="color:${pm.color};font-size:20px"></i>`) + `<span><b>${pm.name}</b> — ${pm.desc}</span><button class="btn btn-outline btn-sm" id="payChangeMethod" style="margin-left:auto;flex-shrink:0;padding:4px 12px;font-size:11px">Change</button>`;
            document.getElementById('payChangeMethod').addEventListener('click', function(e) {
                e.stopPropagation();
                grid.style.display = '';
                selDiv.style.display = 'none';
                selectedPayMethod = null;
                selectedPayChain = null;
                document.getElementById('payInstructions').style.display = 'none';
                document.getElementById('payCryptoChains').style.display = 'none';
                updatePayWhatsAppLink();
            });
            const instDiv = document.getElementById('payInstructions');
            instDiv.innerHTML = `<i class="fa-solid fa-circle-info" style="color:var(--emerald-600)"></i> ` + getPaymentInstructions(methodId);
            instDiv.style.display = 'block';
            const chainDiv = document.getElementById('payCryptoChains');
            const chainList = document.getElementById('payCryptoChainList');
            if (methodId.startsWith('crypto_')) {
                const asset = methodId.replace('crypto_', '').toUpperCase();
                const chains = CRYPTO_CHAINS[asset] || [];
                chainList.innerHTML = chains.length ? chains.map((ch, i) => `<span class="chain-chip ${i===0?'active':''}" data-chain="${ch}">${ch}</span>`).join('') : '<span style="font-size:12px;color:var(--slate-400)">Select network from wallet</span>';
                chainDiv.style.display = 'block';
                selectedPayChain = chains[0] || null;
                chainList.querySelectorAll('.chain-chip').forEach(ch => {
                    ch.addEventListener('click', function() {
                        chainList.querySelectorAll('.chain-chip').forEach(x => x.classList.remove('active'));
                        this.classList.add('active');
                        selectedPayChain = this.getAttribute('data-chain');
                    });
                });
            } else {
                chainDiv.style.display = 'none';
            }
            updatePayWhatsAppLink();
        }

        function openPaymentModal(type, index, amount, label, appId) {
            payTarget = { type, index, appId };
            selectedPayMethod = null;
            selectedPayChain = null;
            document.getElementById('payAmount').textContent = amount;
            document.getElementById('payLabel').textContent = label;
            document.getElementById('payTxnCode').value = '';
            document.getElementById('payInstructions').style.display = 'none';
            document.getElementById('payCryptoChains').style.display = 'none';
            document.getElementById('payMethodSelected').style.display = 'none';
            const grid = document.getElementById('payMethodGrid');
            grid.style.display = '';
            grid.innerHTML = PAYMENT_METHODS.map(pm => `
                <div class="pay-method-card" data-method="${pm.id}">
                    <div class="pm-icon" style="color:${pm.color};${pm.id==='mpesa'?'background:rgba(76,175,80,0.12);border-radius:50%;width:32px;height:32px;display:inline-flex;align-items:center;justify-content:center':''}">${pm.icon.startsWith('<')?pm.icon:`<i class="${pm.icon}"></i>`}</div>
                    <div class="pm-name">${pm.name}${pm.badge?` <span class="pm-badge" style="background:${pm.color};color:#fff">${pm.badge}</span>`:''}</div>
                    <div class="pm-desc">${pm.desc}</div>
                </div>`).join('');
            grid.querySelectorAll('.pay-method-card').forEach(el => {
                el.addEventListener('click', function() {
                    selectPaymentMethod(this.getAttribute('data-method'));
                });
            });
            document.getElementById('paymentModal').style.display = '';
            updatePayWhatsAppLink();
        }

        function updatePayWhatsAppLink() {
            const link = document.getElementById('payWhatsAppLink');
            const amount = document.getElementById('payAmount').textContent;
            const label = document.getElementById('payLabel').textContent;
            const method = selectedPayMethod ? (PAYMENT_METHODS.find(p => p.id === selectedPayMethod)?.name || selectedPayMethod) : 'To be confirmed';
            const chain = selectedPayChain ? `\nPreferred Network: ${selectedPayChain}` : '';
            const msg = encodeURIComponent(
                `Hello Admin/Support Agent.\n\nI would like to make a payment.\n\nService: ${label}\nAmount: ${amount}\nPreferred Payment: ${method}${chain}\n\nPlease provide the correct payment details. Thank you.`
            );
            link.href = `https://wa.me/254703935936?text=${msg}`;
        }

        function closePaymentModal() {
            document.getElementById('paymentModal').style.display = 'none';
            document.getElementById('payMethodGrid').style.display = '';
            document.getElementById('payMethodSelected').style.display = 'none';
            payTarget = null;
            selectedPayMethod = null;
            selectedPayChain = null;
        }

        document.addEventListener('click', function(e) {
            if (e.target.closest('[data-pay-now]')) {
                const btn = e.target.closest('[data-pay-now]');
                const type = btn.getAttribute('data-pay-type');
                const idx = parseInt(btn.getAttribute('data-pay-index'));
                const amount = btn.getAttribute('data-pay-amount');
                const label = btn.getAttribute('data-pay-label');
                const appId = btn.getAttribute('data-pay-appid');
                openPaymentModal(type, idx, amount, label, appId);
            }
        });

        document.getElementById('payConfirmBtn')?.addEventListener('click', async function() {
            if (!payTarget) return;
            if (!selectedPayMethod) { toast('Please select a payment method.', 'err'); return; }
            const { type, index, appId } = payTarget;
            const txnCode = document.getElementById('payTxnCode').value.trim();
            if (!txnCode) { toast('Please enter the transaction or reference code.', 'err'); return; }
            const app = allApps.find(a => (a.id === appId) || (a.appId === appId) || (a.uid === appId));
            if (!app) { toast('Application not found.', 'err'); return; }
            const id = app.id || app.uid;
            const pmName = PAYMENT_METHODS.find(p => p.id === selectedPayMethod)?.name || selectedPayMethod;
            try {
                const s = await getDoc(doc(db, "applications", id));
                if (!s.exists()) { toast('Application not found.', 'err'); return; }
                const data = s.data();
                if (type === 'fee') {
                    const fees = [...(data.fees || [])];
                    if (!fees[index]) return;
                    fees[index].paid = true;
                    fees[index].paidDate = new Date().toISOString();
                    fees[index].paidByClient = true;
                    fees[index].paymentMethod = selectedPayMethod;
                    if (selectedPayChain) fees[index].paymentChain = selectedPayChain;
                    if (txnCode) fees[index].transactionCode = txnCode;
                    await setDoc(doc(db, "applications", id), { fees, updatedAt: serverTimestamp() }, { merge: true });
                    toast(`✅ Payment recorded for "${fees[index].label}" via ${pmName}. Admin will verify shortly.`, 'ok');
                } else if (type === 'service') {
                    const services = [...(data.clientServices || [])];
                    if (!services[index]) return;
                    services[index].paid = true;
                    services[index].paidDate = new Date().toISOString();
                    services[index].paidByClient = true;
                    services[index].paymentMethod = selectedPayMethod;
                    if (selectedPayChain) services[index].paymentChain = selectedPayChain;
                    if (txnCode) services[index].transactionCode = txnCode;
                    await setDoc(doc(db, "applications", id), { clientServices: services, updatedAt: serverTimestamp() }, { merge: true });
                    toast(`✅ Payment recorded for "${services[index].label}" via ${pmName}. Admin will verify shortly.`, 'ok');
                }
                closePaymentModal();
                await loadApps();
                renderCurrentView();
            } catch (e) {
                toast('Payment failed: ' + e.message, 'err');
            }
        });

        document.getElementById('payCloseBtn')?.addEventListener('click', closePaymentModal);
        document.getElementById('paymentModal')?.addEventListener('click', function(e) {
            if (e.target.id === 'paymentModal') closePaymentModal();
        });

        // Global pagination — prev/next buttons
        document.addEventListener('click', function(e) {
            const btn = e.target.closest('[data-pg]');
            if (!btn) return;
            const bar = btn.closest('.pg-bar');
            const key = bar ? bar.getAttribute('data-pgkey') : '';
            if (!key) return;
            const st = pgState(key);
            if (btn.getAttribute('data-pg') === 'prev') st.page = Math.max(1, st.page - 1);
            else if (btn.getAttribute('data-pg') === 'next') st.page = st.page + 1;
            renderCurrentView();
        });
        // Rows-per-page selector
        document.addEventListener('change', function(e) {
            const sel = e.target.closest('.pg-per');
            if (!sel) return;
            const bar = sel.closest('.pg-bar');
            const key = bar ? bar.getAttribute('data-pgkey') : '';
            if (!key) return;
            const st = pgState(key);
            const v = sel.value;
            st.perPage = v === 'All' ? 'All' : parseInt(v, 10);
            st.page = 1;
            renderCurrentView();
        });
    