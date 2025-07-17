<?php
// Load environment variables from .env file
if (file_exists(__DIR__ . '/../.env')) {
    $lines = file(__DIR__ . '/../.env', FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos($line, '=') !== false && strpos($line, '#') !== 0) {
            list($key, $value) = explode('=', $line, 2);
            $_ENV[trim($key)] = trim($value);
        }
    }
}

// Set CORS headers
header('Access-Control-Allow-Origin: ' . $_ENV['REACT_FRONTEND_URL']);
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Origin, Content-Type, Accept, Authorization');
header('Access-Control-Allow-Credentials: true');
header('Content-Type: application/json');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Include database connection
require_once("../database/db.php");

try {
    // Initialize response array
    $response = [
        'success' => true,
        'stats' => [],
        'propertyByType' => [],
        'propertyByStatus' => [],
        'propertiesByCity' => [],
        'propertiesByYear' => [],
        'activePropertyOwners' => [],
        'topLikedProperties' => [],
        'propertyAgeVsPrice' => [],
        'recentActivity' => []
    ];

    // Get user statistics - active users (not deleted)
    $userQuery = "SELECT 
                    COUNT(*) as total_users 
                  FROM users 
                  WHERE is_deleted = false";
    $userStmt = $pdo->prepare($userQuery);
    $userStmt->execute();
    $userData = $userStmt->fetch(PDO::FETCH_ASSOC);
    
    // Get users created in the last 30 days
    $newUsersQuery = "SELECT 
                        COUNT(*) as new_users 
                      FROM users 
                      WHERE is_deleted = false 
                      AND created_at >= CURRENT_DATE - INTERVAL '30 days'";
    $newUsersStmt = $pdo->prepare($newUsersQuery);
    $newUsersStmt->execute();
    $newUsersData = $newUsersStmt->fetch(PDO::FETCH_ASSOC);
    
    // Calculate user growth trend
    $prevPeriodUsersQuery = "SELECT 
                                COUNT(*) as prev_users 
                             FROM users 
                             WHERE is_deleted = false 
                             AND created_at BETWEEN CURRENT_DATE - INTERVAL '60 days' AND CURRENT_DATE - INTERVAL '30 days'";
    $prevPeriodStmt = $pdo->prepare($prevPeriodUsersQuery);
    $prevPeriodStmt->execute();
    $prevPeriodData = $prevPeriodStmt->fetch(PDO::FETCH_ASSOC);
    
    // Calculate trend percentage
    $userTrend = 0;
    if ($prevPeriodData['prev_users'] > 0) {
        $userTrend = round((($newUsersData['new_users'] - $prevPeriodData['prev_users']) / $prevPeriodData['prev_users']) * 100);
    } elseif ($newUsersData['new_users'] > 0) {
        $userTrend = 100;
    }
    
    // Add user stats to response
    $response['stats']['users'] = [
        'total' => (int)$userData['total_users'],
        'trend' => $userTrend
    ];
    
    // Get property statistics
    $propertyQuery = "SELECT 
                        COUNT(*) as total_properties 
                      FROM chalets 
                      WHERE is_deleted = false";
    $propertyStmt = $pdo->prepare($propertyQuery);
    $propertyStmt->execute();
    $propertyData = $propertyStmt->fetch(PDO::FETCH_ASSOC);
    
    // Get properties created in the last 30 days
    $newPropertiesQuery = "SELECT 
                            COUNT(*) as new_properties 
                           FROM chalets 
                           WHERE is_deleted = false 
                           AND created_at >= CURRENT_DATE - INTERVAL '30 days'";
    $newPropertiesStmt = $pdo->prepare($newPropertiesQuery);
    $newPropertiesStmt->execute();
    $newPropertiesData = $newPropertiesStmt->fetch(PDO::FETCH_ASSOC);
    
    // Calculate property growth trend
    $prevPeriodPropertiesQuery = "SELECT 
                                    COUNT(*) as prev_properties 
                                  FROM chalets 
                                  WHERE is_deleted = false 
                                  AND created_at BETWEEN CURRENT_DATE - INTERVAL '60 days' AND CURRENT_DATE - INTERVAL '30 days'";
    $prevPeriodPropertiesStmt = $pdo->prepare($prevPeriodPropertiesQuery);
    $prevPeriodPropertiesStmt->execute();
    $prevPeriodPropertiesData = $prevPeriodPropertiesStmt->fetch(PDO::FETCH_ASSOC);
    
    // Calculate trend percentage
    $propertyTrend = 0;
    if ($prevPeriodPropertiesData['prev_properties'] > 0) {
        $propertyTrend = round((($newPropertiesData['new_properties'] - $prevPeriodPropertiesData['prev_properties']) / $prevPeriodPropertiesData['prev_properties']) * 100);
    } elseif ($newPropertiesData['new_properties'] > 0) {
        $propertyTrend = 100;
    }
    
    // Add property stats to response
    $response['stats']['properties'] = [
        'total' => (int)$propertyData['total_properties'],
        'trend' => $propertyTrend
    ];
    
    // Get property types distribution
    $propertyTypesQuery = "SELECT 
                            property_type as name, 
                            COUNT(*) as count 
                           FROM chalets 
                           WHERE is_deleted = false 
                           GROUP BY property_type";
    $propertyTypesStmt = $pdo->prepare($propertyTypesQuery);
    $propertyTypesStmt->execute();
    $propertyTypes = $propertyTypesStmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Calculate percentages for property types
    $totalProperties = array_sum(array_column($propertyTypes, 'count'));
    foreach ($propertyTypes as &$type) {
        $type['percentage'] = $totalProperties > 0 ? round(($type['count'] / $totalProperties) * 100) : 0;
        $type['count'] = (int)$type['count'];
    }
    
    $response['propertyByType'] = $propertyTypes;
    
    // Get property status distribution
    $propertyStatusQuery = "SELECT 
                             status as name, 
                             COUNT(*) as count 
                            FROM chalets 
                            WHERE is_deleted = false 
                            GROUP BY status";
    $propertyStatusStmt = $pdo->prepare($propertyStatusQuery);
    $propertyStatusStmt->execute();
    $propertyStatus = $propertyStatusStmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Calculate percentages for property status
    foreach ($propertyStatus as &$status) {
        $status['percentage'] = $totalProperties > 0 ? round(($status['count'] / $totalProperties) * 100) : 0;
        $status['count'] = (int)$status['count'];
    }
    
    $response['propertyByStatus'] = $propertyStatus;
    
    // Properties by City Distribution
    $propertiesByCityQuery = "SELECT 
                               city as name, 
                               COUNT(*) as count 
                              FROM chalets 
                              WHERE is_deleted = false 
                              GROUP BY city 
                              ORDER BY count DESC 
                              LIMIT 10";
    $propertiesByCityStmt = $pdo->prepare($propertiesByCityQuery);
    $propertiesByCityStmt->execute();
    $propertiesByCity = $propertiesByCityStmt->fetchAll(PDO::FETCH_ASSOC);

    foreach ($propertiesByCity as &$city) {
        $city['percentage'] = $totalProperties > 0 ? round(($city['count'] / $totalProperties) * 100) : 0;
        $city['count'] = (int)$city['count'];
    }

    $response['propertiesByCity'] = $propertiesByCity;

    // Properties by Year Built
    $propertiesByYearQuery = "SELECT 
                               year_built as name,
                               COUNT(*) as count 
                              FROM chalets 
                              WHERE is_deleted = false 
                              AND year_built IS NOT NULL
                              GROUP BY year_built 
                              ORDER BY year_built";
    $propertiesByYearStmt = $pdo->prepare($propertiesByYearQuery);
    $propertiesByYearStmt->execute();
    $propertiesByYear = $propertiesByYearStmt->fetchAll(PDO::FETCH_ASSOC);

    foreach ($propertiesByYear as &$yearData) {
        $yearData['name'] = (string)$yearData['name'];
        $yearData['count'] = (int)$yearData['count'];
    }

    $response['propertiesByYear'] = $propertiesByYear;

    // Most Active Property Owners
    $activeOwnersQuery = "SELECT 
                           u.id,
                           u.name,
                           COUNT(c.id) as count
                          FROM users u
                          JOIN chalets c ON u.id = c.user_id
                          WHERE u.is_deleted = false
                          AND c.is_deleted = false
                          GROUP BY u.id, u.name
                          ORDER BY count DESC
                          LIMIT 10";
    $activeOwnersStmt = $pdo->prepare($activeOwnersQuery);
    $activeOwnersStmt->execute();
    $activeOwners = $activeOwnersStmt->fetchAll(PDO::FETCH_ASSOC);

    foreach ($activeOwners as &$owner) {
        $owner['count'] = (int)$owner['count'];
    }

    $response['activePropertyOwners'] = $activeOwners;

    // Top Liked Properties
    $topLikedPropertiesQuery = "SELECT 
                                 c.id,
                                 c.title as name,
                                 COUNT(uf.id) as count
                                FROM chalets c
                                JOIN user_favorites uf ON c.id = uf.chalet_id
                                WHERE c.is_deleted = false
                                GROUP BY c.id, c.title
                                ORDER BY count DESC
                                LIMIT 10";
    $topLikedPropertiesStmt = $pdo->prepare($topLikedPropertiesQuery);
    $topLikedPropertiesStmt->execute();
    $topLikedProperties = $topLikedPropertiesStmt->fetchAll(PDO::FETCH_ASSOC);

    foreach ($topLikedProperties as &$prop) {
        $prop['count'] = (int)$prop['count'];
    }

    $response['topLikedProperties'] = $topLikedProperties;

    // Property Age vs Price
    $propertyAgeVsPriceQuery = "SELECT 
                                id,
                                title,
                                price,
                                EXTRACT(YEAR FROM CURRENT_DATE) - year_built as age,
                                property_type
                               FROM chalets
                               WHERE is_deleted = false
                               AND year_built IS NOT NULL
                               ORDER BY year_built DESC
                               LIMIT 100";
    $propertyAgeVsPriceStmt = $pdo->prepare($propertyAgeVsPriceQuery);
    $propertyAgeVsPriceStmt->execute();
    $propertyAgeVsPrice = $propertyAgeVsPriceStmt->fetchAll(PDO::FETCH_ASSOC);

    foreach ($propertyAgeVsPrice as &$prop) {
        $prop['age'] = (int)$prop['age'];
        $prop['price'] = (float)$prop['price'];
    }

    $response['propertyAgeVsPrice'] = $propertyAgeVsPrice;
    
    // Get likes count
    $likesQuery = "SELECT COUNT(*) as total_likes FROM user_favorites";
    $likesStmt = $pdo->prepare($likesQuery);
    $likesStmt->execute();
    $likesData = $likesStmt->fetch(PDO::FETCH_ASSOC);
    
    // Get likes in the last 30 days
    $newLikesQuery = "SELECT COUNT(*) as new_likes FROM user_favorites WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'";
    $newLikesStmt = $pdo->prepare($newLikesQuery);
    $newLikesStmt->execute();
    $newLikesData = $newLikesStmt->fetch(PDO::FETCH_ASSOC);
    
    // Calculate likes trend
    $prevPeriodLikesQuery = "SELECT COUNT(*) as prev_likes FROM user_favorites WHERE created_at BETWEEN CURRENT_DATE - INTERVAL '60 days' AND CURRENT_DATE - INTERVAL '30 days'";
    $prevPeriodLikesStmt = $pdo->prepare($prevPeriodLikesQuery);
    $prevPeriodLikesStmt->execute();
    $prevPeriodLikesData = $prevPeriodLikesStmt->fetch(PDO::FETCH_ASSOC);
    
    $likesTrend = 0;
    if ($prevPeriodLikesData['prev_likes'] > 0) {
        $likesTrend = round((($newLikesData['new_likes'] - $prevPeriodLikesData['prev_likes']) / $prevPeriodLikesData['prev_likes']) * 100);
    } elseif ($newLikesData['new_likes'] > 0) {
        $likesTrend = 100;
    }
    
    // Add likes stats to response
    $response['stats']['likes'] = [
        'total' => (int)$likesData['total_likes'],
        'trend' => $likesTrend
    ];
    
    // Calculate total property value
    $totalPropertyValueQuery = "SELECT SUM(price) as total_value FROM chalets WHERE is_deleted = false";
    $totalPropertyValueStmt = $pdo->prepare($totalPropertyValueQuery);
    $totalPropertyValueStmt->execute();
    $totalPropertyValueData = $totalPropertyValueStmt->fetch(PDO::FETCH_ASSOC);
    
    // Recent total value (last 30 days)
    $recentValueQuery = "SELECT SUM(price) as recent_value FROM chalets WHERE is_deleted = false AND created_at >= CURRENT_DATE - INTERVAL '30 days'";
    $recentValueStmt = $pdo->prepare($recentValueQuery);
    $recentValueStmt->execute();
    $recentValueData = $recentValueStmt->fetch(PDO::FETCH_ASSOC);
    
    // Previous period total value
    $prevValueQuery = "SELECT SUM(price) as prev_value FROM chalets WHERE is_deleted = false AND created_at BETWEEN CURRENT_DATE - INTERVAL '60 days' AND CURRENT_DATE - INTERVAL '30 days'";
    $prevValueStmt = $pdo->prepare($prevValueQuery);
    $prevValueStmt->execute();
    $prevValueData = $prevValueStmt->fetch(PDO::FETCH_ASSOC);
    
    // Calculate value trend
    $valueTrend = 0;
    if ($prevValueData['prev_value'] > 0) {
        $valueTrend = round((($recentValueData['recent_value'] - $prevValueData['prev_value']) / $prevValueData['prev_value']) * 100);
    } elseif ($recentValueData['recent_value'] > 0) {
        $valueTrend = 100;
    }
    
    // Add total property value stats to response
    $response['stats']['revenue'] = [
        'total' => (float)$totalPropertyValueData['total_value'] ?: 0,
        'trend' => $valueTrend
    ];
    
    // Get recent activity
    // Recent user registrations
    $recentUsersQuery = "SELECT 
                          id, 
                          name as user, 
                          'registered a new account' as action,
                          created_at as time
                        FROM users 
                        WHERE is_deleted = false 
                        ORDER BY created_at DESC 
                        LIMIT 3";
    $recentUsersStmt = $pdo->prepare($recentUsersQuery);
    $recentUsersStmt->execute();
    $recentUsers = $recentUsersStmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Recently added properties
    $recentPropertiesQuery = "SELECT 
                               c.id,
                               u.name as user,
                               'listed a new property' as action,
                               c.created_at as time
                             FROM chalets c
                             JOIN users u ON c.user_id = u.id
                             WHERE c.is_deleted = false
                             ORDER BY c.created_at DESC
                             LIMIT 3";
    $recentPropertiesStmt = $pdo->prepare($recentPropertiesQuery);
    $recentPropertiesStmt->execute();
    $recentProperties = $recentPropertiesStmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Recent likes/favorites
    $recentLikesQuery = "SELECT 
                           f.id,
                           u.name as user,
                           'liked a property' as action,
                           f.created_at as time
                         FROM user_favorites f
                         JOIN users u ON f.user_id = u.id
                         ORDER BY f.created_at DESC
                         LIMIT 2";
    $recentLikesStmt = $pdo->prepare($recentLikesQuery);
    $recentLikesStmt->execute();
    $recentLikes = $recentLikesStmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Combine all activities
    $allActivities = array_merge($recentUsers, $recentProperties, $recentLikes);
    
    // Sort by time (most recent first)
    usort($allActivities, function($a, $b) {
        return strtotime($b['time']) - strtotime($a['time']);
    });
    
    // Format the time to "X hours ago"
    foreach ($allActivities as &$activity) {
        $activityTime = strtotime($activity['time']);
        $now = time();
        $diffSeconds = $now - $activityTime;
        
        if ($diffSeconds < 60) {
            $activity['time'] = 'just now';
        } elseif ($diffSeconds < 3600) {
            $mins = floor($diffSeconds / 60);
            $activity['time'] = $mins . ' ' . ($mins == 1 ? 'minute' : 'minutes') . ' ago';
        } elseif ($diffSeconds < 86400) {
            $hours = floor($diffSeconds / 3600);
            $activity['time'] = $hours . ' ' . ($hours == 1 ? 'hour' : 'hours') . ' ago';
        } else {
            $days = floor($diffSeconds / 86400);
            $activity['time'] = $days . ' ' . ($days == 1 ? 'day' : 'days') . ' ago';
        }
    }
    
    // Take only the 8 most recent activities
    $response['recentActivity'] = array_slice($allActivities, 0, 8);
    
    // Return the JSON response
    echo json_encode($response);
    
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Database error: ' . $e->getMessage()
    ]);
}

?>