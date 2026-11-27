@extends('errors.layout')
@section('code', '503')
@section('title', app()->getLocale() === 'ar' ? 'الموقع تحت الصيانة حاليًا' : 'Scheduled Maintenance')
@section('message', app()->getLocale() === 'ar' ? 'نقوم ببعض التحديثات السريعة لتحسين تجربتك، سنعود خلال دقائق.' : 'We are performing quick updates. Please check back shortly.')
