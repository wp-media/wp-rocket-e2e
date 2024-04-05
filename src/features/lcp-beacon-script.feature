@lcp @setup
Feature: Beacon script captures the right images.

    Background:
        Given I am logged in
        And plugin is installed 'new_release'
        And plugin is activated

    Scenario: Beacon captures expected images in desktop
        When I log out
        And I visit the following urls in 'desktop'
        | path                               | atfs                                                                                                                                                                                      |
        | lcp_bg_inline_template             | /wp-content/rocket-test-data/images/lcp/testjpeg.jpeg                                                                                                                                     |
        | lcp_bg_samestyle_template          | wp-content/rocket-test-data/images/lcp/testjpg.jpg                                                                                                                                        |
        | lcp_img_loadedbydynamicjs_template | http://www.google.com/intl/en_com/images/logo_plain.png                                                                                                                                   |
        | lcp_img_loadedbyjs_template        | /test.png, https://new.rocketlabsqa.ovh/wp-content/rocket-test-data/images/istockphoto-1184692500-612x612.webp                                                                            |
        | lcp_with_space_after_title         | /wp-content/rocket-test-data/images/test_inline2.jpeg                                                                                                                                     |
        | lcp_test_template                  | /wp-content/rocket-test-data/images/lipsum_logo.jpg                                                                                                                                       |
        | lcp_bg_responsive_webkit_template  | /wp-content/rocket-test-data/image/test3.webp, /wp-content/rocket-test-data/images/lcp/testwebp.webp                                                                                      |
        | lcp_regular_image_template         | /test.png, /wp-content/rocket-test-data/images/test_inline2.jpeg, /wp-content/rocket-test-data/images/Przechwytywanie.PNG, /wp-content/rocket-test-data/images/file_example_JPG_100kB.jpg |
        Then lcp and atf should be as expected in 'desktop'

    Scenario: Beacon captures expected images in mobile
        When I log out
        And I visit the following urls in 'mobile'
        | path                               | atfs                                                                                                                                                                                                                                                                                                                                                  |
        | lcp_bg_inline_template             | /wp-content/rocket-test-data/images/test_inline2.jpeg                                                                                                                                                                                                                                                                                                 |
        | lcp_bg_samestyle_template          | https://new.rocketlabsqa.ovh/wp-content/rocket-test-data/images/lcp/testavif.avif                                                                                                                                                                                                                                                                     |
        | lcp_img_loadedbydynamicjs_template | http://www.google.com/intl/en_com/images/logo_plain.png                                                                                                                                                                                                                                                                                               |
        | lcp_img_loadedbyjs_template        | /test.png, https://new.rocketlabsqa.ovh/wp-content/rocket-test-data/images/istockphoto-1184692500-612x612.webp                                                                                                                                                                                                                                        |
        | lcp_with_space_after_title         | https://new.rocketlabsqa.ovh/wp-content/rocket-test-data/images/test_inline2.jpeg                                                                                                                                                                                                                                                                     |
        | lcp_test_template                  | /wp-content/rocket-test-data/images/test_internal2.jpg, https://new.rocketlabsqa.ovh/wp-content/rocket-test-data/images/lipsum_logo.jpg                                                                                                                                                                                                               |
        | lcp_bg_responsive_webkit_template  | https://rocketlabsqa.ovh/wp-content/rocket-test-data/images/fixtheissue.jpg                                                                                                                                                                                                                                                                           |
        | lcp_regular_image_template         | /test.png, /wp-content/rocket-test-data/images/test_inline2.jpeg, /wp-content/rocket-test-data/images/lcp/testPng.png, /wp-content/rocket-test-data/images/Przechwytywanie.PNG, /wp-content/rocket-test-data/images/file_example_JPG_100kB.jpg, /wp-content/rocket-test-data/images/img_nature.jpg, /wp-content/rocket-test-data/images/mountain.webp |
        Then lcp and atf should be as expected in 'mobile'
