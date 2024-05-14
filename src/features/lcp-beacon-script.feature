@lcp @setup
Feature: Beacon script captures the right images.

    Background:
        Given I am logged in
        And plugin is installed 'new_release'
        And plugin is activated
        And I go to 'wp-admin/options-general.php?page=wprocket#dashboard'
        And plugin 'sitepress-multilingual-cms' is deactivated

    Scenario: Beacon captures expected images in desktop
        When I log out
        And I visit the following urls in 'desktop'
            | path                                  | atfs                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
            | lcp_bg_inline_template                | /wp-content/rocket-test-data/images/lcp/testjpeg.jpeg                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
            | lcp_bg_samestyle_template             | wp-content/rocket-test-data/images/lcp/testjpg.jpg                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
            | lcp_img_loadedbydynamicjs_template    | http://www.google.com/intl/en_com/images/logo_plain.png                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
            | lcp_bg_multimage_template             | https://fastly.picsum.photos/id/976/200/300.jpg?hmac=s1Uz9fgJv32r8elfaIYn7pLpQXps7X9oYNwC5XirhO8, https://rocketlabsqa.ovh/wp-content/rocket-test-data/images/fixtheissue.jpg                                                                                                                                                                                                                                                                                                                                                                                                                       |
#        | lcp_with_space_after_title            | /wp-content/rocket-test-data/images/test_inline2.jpeg                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
            | lcp_test_template                     | /wp-content/rocket-test-data/images/lipsum_logo.jpg                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
#        | lcp_bg_responsive_webkit_template     | /wp-content/rocket-test-data/image/test3.webp, /wp-content/rocket-test-data/images/lcp/testwebp.webp                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
#        | lcp_regular_image_template            | /test.png, /wp-content/rocket-test-data/images/test_inline2.jpeg, /wp-content/rocket-test-data/images/Przechwytywanie.PNG, /wp-content/rocket-test-data/images/file_example_JPG_100kB.jpg                                                                                                                                                                                                                                                                                                                                                                                                           |
            | lcp_bg_multimage_template             | https://fastly.picsum.photos/id/976/200/300.jpg?hmac=s1Uz9fgJv32r8elfaIYn7pLpQXps7X9oYNwC5XirhO8, https://rocketlabsqa.ovh/wp-content/rocket-test-data/images/fixtheissue.jpg                                                                                                                                                                                                                                                                                                                                                                                                                       |
#        | lcp_bg_reponsive_imgset_template      | https://fastly.picsum.photos/id/976/200/300.jpg?hmac=s1Uz9fgJv32r8elfaIYn7pLpQXps7X9oYNwC5XirhO8                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
#        | lcp_rsponsive_imagegrid               | https://www.w3schools.com/w3images/wedding.jpg, https://e2e.rocketlabsqa.ovh/wp-content/rocket-test-data/images/lcp/testjpg4.jpg, https://www.w3schools.com/w3images/ocean.jpg, https://e2e.rocketlabsqa.ovh/wp-content/rocket-test-data/images/lcp/testjpg4.jpg, https://e2e.rocketlabsqa.ovh/wp-content/rocket-test-data/images/lcp/testavif.avif, /wp-content/rocket-test-data/images/lcp/testwebp.webp, /wp-content/rocket-test-data/images/Przechwytywanie.PNG, /wp-content/rocket-test-data/images/file_example_JPG_100kB.jpg, /wp-content/rocket-test-data/images/file_example_JPG_100kB.jpg |
#        | lcp_attribute_template                | https://new.rocketlabsqa.ovh/wp-content/rocket-test-data/images/lcp/testPng.png, https://new.rocketlabsqa.ovh/wp-content/rocket-test-data/images/wp-rocket2.svg, /wp-content/rocket-test-data/images/lcp/testsvg.svg, /wp-content/rocket-test-data/images/lcp/testjpeg.jpeg, https://rocketlabsqa.ovh/wp-content/rocket-test-data/images/fixtheissue.jpg, /wp-content/rocket-test-data/images/lcp/testavif.avif, /test.png, /wp-content/rocket-test-data/images/lcp/testgif.gif                                                                                                                     |
            | lcp_no_dimension_svg                  | []                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
            | lcp_no_dimensions_picture             | /test.png, https://e2e.rocketlabsqa.ovh/wp-content/rocket-test-data/images/test3.gif                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
#        | lcp_no_dimension_absolute_url         | /rocket-test-data/images/lcp/testPng.png, https://cdn.pixabay.com/photo/2023/06/05/02/01/starry-sky-8041247_1280.jpg                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
#        | lcp_image_withspecialchar_template    | /wp-content/rocket-test-data/images/testspace%202.png, https://new.rocketlabsqa.ovh/wp-content/rocket-test-data/images/paperéquipesTest.jpeg                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
#        | lcp_img_addedbydynamicstyle_template  | /wp-content/rocket-test-data/images/paper.jpeg, https://cdn.pixabay.com/photo/2023/06/05/02/01/starry-sky-8041247_1280.jpg                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
#        | lcp_withfetchpriorityhigh_template    | https://e2e.rocketlabsqa.ovh/wp-content/rocket-test-data/images/lcp/testjpeg.jpeg                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
#        | lcp_single_double                     | /wp-content/rocket-test-data/images/lcp/testwebp.webp                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
            | lcp_withfetchprioritylow_template     | []                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
            | lcp_withfetchpriorityempty_template   | []                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
            | lcp_withfetchpriorityinurl_template   | []                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
            | lcp_video_poster_template             | []                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
            | lcp_big_image_template                | []                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
            | lcp_no_fetchpriority                  | []                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
            | lcp_6330_template                     | []                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
        Then lcp and atf should be as expected in 'desktop'

    Scenario: Beacon captures expected images in mobile
        When I log out
        And I visit the following urls in 'mobile'
            | path                                  | atfs                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
            | lcp_bg_inline_template                | /wp-content/rocket-test-data/images/test_inline2.jpeg                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
            | lcp_bg_samestyle_template             | https://new.rocketlabsqa.ovh/wp-content/rocket-test-data/images/lcp/testavif.avif                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
            | lcp_img_loadedbydynamicjs_template    | http://www.google.com/intl/en_com/images/logo_plain.png                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
#        | lcp_img_loadedbyjs_template           | /test.png, https://new.rocketlabsqa.ovh/wp-content/rocket-test-data/images/istockphoto-1184692500-612x612.webp                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
#        | lcp_with_space_after_title            | https://new.rocketlabsqa.ovh/wp-content/rocket-test-data/images/test_inline2.jpeg                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
            | lcp_test_template                     | /wp-content/rocket-test-data/images/test_internal2.jpg, https://new.rocketlabsqa.ovh/wp-content/rocket-test-data/images/lipsum_logo.jpg                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
#        | lcp_bg_responsive_webkit_template     | https://rocketlabsqa.ovh/wp-content/rocket-test-data/images/fixtheissue.jpg                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
#        | lcp_regular_image_template            | /test.png, /wp-content/rocket-test-data/images/test_inline2.jpeg, /wp-content/rocket-test-data/images/lcp/testPng.png, /wp-content/rocket-test-data/images/Przechwytywanie.PNG, /wp-content/rocket-test-data/images/file_example_JPG_100kB.jpg, /wp-content/rocket-test-data/images/img_nature.jpg, /wp-content/rocket-test-data/images/mountain.webp                                                                                                                                                                                                                                               |
            | lcp_bg_multimage_template             | https://fastly.picsum.photos/id/976/200/300.jpg?hmac=s1Uz9fgJv32r8elfaIYn7pLpQXps7X9oYNwC5XirhO8, https://new.rocketlabsqa.ovh/wp-content/rocket-test-data/image/test3.webp                                                                                                                                                                                                                                                                                                                                                                                                                         |
#        | lcp_bg_reponsive_imgset_template      | https://fastly.picsum.photos/id/976/200/300.jpg?hmac=s1Uz9fgJv32r8elfaIYn7pLpQXps7X9oYNwC5XirhO8                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
#        | lcp_rsponsive_imagegrid               | https://www.w3schools.com/w3images/wedding.jpg, https://e2e.rocketlabsqa.ovh/wp-content/rocket-test-data/images/lcp/testjpg4.jpg, https://www.w3schools.com/w3images/ocean.jpg, https://e2e.rocketlabsqa.ovh/wp-content/rocket-test-data/images/lcp/testjpg4.jpg, https://e2e.rocketlabsqa.ovh/wp-content/rocket-test-data/images/lcp/testavif.avif, /wp-content/rocket-test-data/images/lcp/testwebp.webp, /wp-content/rocket-test-data/images/Przechwytywanie.PNG, /wp-content/rocket-test-data/images/file_example_JPG_100kB.jpg, /wp-content/rocket-test-data/images/file_example_JPG_100kB.jpg |
#        | lcp_attribute_template                | https://new.rocketlabsqa.ovh/wp-content/rocket-test-data/images/lcp/testPng.png, https://new.rocketlabsqa.ovh/wp-content/rocket-test-data/images/wp-rocket2.svg, /wp-content/rocket-test-data/images/lcp/testsvg.svg                                                                                                                                                                                                                                                                                                                                                                                |
            | lcp_no_dimension_svg                  | https://discuss-assets.s3.amazonaws.com/original/3X/1/9/19823cc1f1f887d70755e0b500dd8ce2c51ba7f9.svg                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
            | lcp_no_dimensions_picture             | /test.png, https://e2e.rocketlabsqa.ovh/wp-content/rocket-test-data/images/test3.gif                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
#        | lcp_no_dimension_absolute_url         | /rocket-test-data/images/lcp/testPng.png, /rocket-test-data/images/lcp/testjpg.jpg                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
#        | lcp_image_withspecialchar_template    | /wp-content/rocket-test-data/images/testspace%202.png, https://new.rocketlabsqa.ovh/wp-content/rocket-test-data/images/paperéquipesTest.jpeg                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
#        | lcp_img_addedbydynamicstyle_template  | https://new.rocketlabsqa.ovh/wp-content/rocket-test-data/images/lcp/testjpg.jpg , /wp-content/rocket-test-data/images/paper.jpeg                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
#        | lcp_withfetchpriorityhigh_template    | https://e2e.rocketlabsqa.ovh/wp-content/rocket-test-data/images/lcp/testjpeg.jpeg                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
#        | lcp_single_double                     | []                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
            | lcp_withfetchprioritylow_template     | []                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
            | lcp_withfetchpriorityempty_template   | []                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
            | lcp_withfetchpriorityinurl_template   | []                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
            | lcp_video_poster_template             | []                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
            | lcp_big_image_template                | []                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
            | lcp_no_fetchpriority                  | []                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
            | lcp_6330_template                     | []                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
        Then lcp and atf should be as expected in 'mobile'

    Scenario: Beacon returns no LCP and ATF in mobile
        And install 'https://github.com/wp-media/wp-rocket-e2e-test-helper/blob/main/helper-plugin/force-wp-mobile.zip' plugin
        And plugin 'force-wp-mobile' is activated
        When I log out
        And I go to 'lcp_no_images' in 'mobile'
        And plugin 'force-wp-mobile' is deactivated
        Then I must not see any LCP or ATF

    Scenario: Beacon returns no LCP and ATF in desktop
        When I log out
        And I go to 'lcp_no_images' in 'desktop'
        Then I must not see any LCP or ATF
