@lcp @delaylcp @setup @priorityelements
Feature: Beacon script captures the right images.

    Background:
        Given I am logged in
        And plugin is installed 'new_release'
        And plugin is activated
        And I go to 'wp-admin/options-general.php?page=wprocket#dashboard'
        And plugin 'sitepress-multilingual-cms' is deactivated

  @test
  Scenario Outline: Beacon captures expected images and no console errors in desktop for <url>
    Given I log out
    And I visit the url "<url>" for 'desktop'
    Then 'lcp and atf' should be as expected for 'desktop' at "<url>"
    And I am logged in
    And I clear cache
    And I log out
    Then validate that url "<url>" in 'desktop' does not have console errors different than nowprocket

    Examples:
      | url                                |
      | lcp_bg_inline_template             |
      | lcp_bg_samestyle_template          |
      | lcp_img_loadedbydynamicjs_template |
      | lcp_img_loadedbyjs_template        |
      | lcp_bg_multimage_template          |
      | lcp_with_space_after_title         |
      | lcp_test_template                  |
      | lcp_bg_responsive_webkit_template  |
      | lcp_regular_image_template         |
      | lcp_dynamicvisibility              |
      | lcp_attribute_template             |
      | lcp_no_dimension_svg               |
      | lcp_no_dimensions_picture          |
      | lcp_no_dimension_absolute_url      |
      | lcp_image_withspecialchar_template |
      | lcp_img_addedbydynamicstyle_template |
      | lcp_withfetchpriorityhigh_template |
      | lcp_single_double                  |
      | lcp_withfetchprioritylow_template  |
      | lcp_withfetchpriorityempty_template|
      | lcp_withfetchpriorityinurl_template|
      | lcp_video_poster_template          |
      | lcp_big_image_template             |
      | lcp_no_fetchpriority               |
      | lcp_no_images                      |
      | lcp_picture_template               |
      | lcp_picture_template2              |
      | lcp_bg_img_in_section              |
      | lcp_section_template_relative      |
      | lcp_section_template2              |
      | lcp_bg_relative_attribute_incss    |
      | lcp_bg_img_in_header_template      |
      | lcp_6647_svgbg_template            |
      | lcp_6599_template2                 |
      | lcp_picture_media_type_mixed       |
      | lcp_picture_relative               |
      | lcp_invisibleatf                   |
      | lcp_invisibleatf2                  |
      | lcp_invisibleatf3                  |
      | lcp_hidden_visibility              |
      | lcp_responsive_image               |
      | lcp_bg_responsive_imgset_template  |
      | lcp_multiple_background_pseudo_bg_template |
      | lcp_pseudo_class_element           |
      | lcp_picture_template2_maxheight    |
      | lcp_picture_issue                  |
      | lcp_specialchar_template           |
      | lcp_specialchar2                   |
      | lcp_images_in_root                 |
      | lcp_before_after                   |
      | lcp_resposive_imagegrid            |
      | lcp_images_intersecting_b          |
      | lcp_images_intersecting_a          |
      | lcp_transformed_images_template    |
      | lcp_nested_images_template         |