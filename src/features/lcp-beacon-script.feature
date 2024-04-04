@lcp @setup @lcpbeacon
Feature: Beacon script captures the right images.

    Background:
        Given I am logged in
        And plugin is installed 'new_release'
        And plugin is activated

    Scenario: Beacon captures expected images in desktop
        Given I log out
        And I visit the following urls in 'desktop'
        | path                               | urls                                                             | atfs                                                                                                           |
        | lcp_bg_inline_template             | https://e2e.rocketlabsqa.ovh/lcp_bg_inline_template/             | /wp-content/rocket-test-data/images/lcp/testjpeg.jpeg                                                          |
        | lcp_bg_samestyle_template          | https://e2e.rocketlabsqa.ovh/lcp_bg_samestyle_template/          | wp-content/rocket-test-data/images/lcp/testjpg.jpg                                                             |
        | lcp_img_loadedbydynamicjs_template | https://e2e.rocketlabsqa.ovh/lcp_img_loadedbydynamicjs_template/ | http://www.google.com/intl/en_com/images/logo_plain.png                                                        |
        | lcp_img_loadedbyjs_template        | https://e2e.rocketlabsqa.ovh/lcp_img_loadedbyjs_template/        | /test.png, https://new.rocketlabsqa.ovh/wp-content/rocket-test-data/images/istockphoto-1184692500-612x612.webp |
        Then lcp and atf should be as expected in 'desktop'

    Scenario: Beacon captures expected images in mobile
        Given I log out
        And I visit the following urls in 'mobile'
        | path                               | urls                                                             | atfs                                                                                                           |
        | lcp_bg_inline_template             | https://e2e.rocketlabsqa.ovh/lcp_bg_inline_template/             | /wp-content/rocket-test-data/images/test_inline2.jpeg                                                          |
        | lcp_bg_samestyle_template          | https://e2e.rocketlabsqa.ovh/lcp_bg_samestyle_template/          | https://new.rocketlabsqa.ovh/wp-content/rocket-test-data/images/lcp/testavif.avif                              |
        | lcp_img_loadedbydynamicjs_template | https://e2e.rocketlabsqa.ovh/lcp_img_loadedbydynamicjs_template/ | http://www.google.com/intl/en_com/images/logo_plain.png                                                        |
        | lcp_img_loadedbyjs_template        | https://e2e.rocketlabsqa.ovh/lcp_img_loadedbyjs_template/        | /test.png, https://new.rocketlabsqa.ovh/wp-content/rocket-test-data/images/istockphoto-1184692500-612x612.webp |
        Then lcp and atf should be as expected in 'mobile'
